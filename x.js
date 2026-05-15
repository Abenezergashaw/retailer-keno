import express from "express";
import axios from "axios";
import db from "./db.js";
import { getKey } from "./config.js";
import { JSDOM } from "jsdom";
import { getServerTimeInNairobi } from "./timezone.js";
import { redisClient } from "./redis.js";

const url = "http://0.0.0.0.:3000";
const pley = "http://100.67.28.84:8000";

const router = express.Router();

function extractWinNumbersFromHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 1ï¸âƒ£ CycleRacing-style badges
  const badgeNumbers = Array.from(
    document.querySelectorAll('span[style*="background: #19c11c"]'),
  )
    .map((el) => el.textContent.trim())
    .filter((n) => /^\d+$/.test(n));

  if (badgeNumbers.length >= 3) {
    return badgeNumbers.slice(0, 3).map(Number);
  }

  // 2ï¸âƒ£ PlatinumHounds-style results
  const h1Numbers = Array.from(
    document.querySelectorAll(".results-container .result-item h1"),
  )
    .map((el) => el.textContent.trim())
    .filter((n) => /^\d+$/.test(n));

  if (h1Numbers.length >= 3) {
    return h1Numbers.slice(0, 3).map(Number);
  }

  return [];
}
//const getEventDetail = async (body) => {
//const { data } = await axios.post(`${pley}/event-detail`, body);
// return data;
//};

const getEventDetail = async (body) => {
  // 1. Create a unique key based on the event body (e.g., eventId)
  // Example: "detail:{"eventId": 123, "feedId": 8080}"
  const cacheKey = `detail:${JSON.stringify(body)}`;

  try {
    // 2. Check if the detail is already in Redis
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log("? Redis Hit: Event Detail");
      return JSON.parse(cachedData);
    }

    // 3. If not in Redis, fetch from the external API
    console.log("?? Redis Miss: Fetching Event Detail from API...");
    const { data } = await axios.post(`${pley}/event-detail`, body);

    // 4. Save to Redis for 20 minutes (1200 seconds)
    const isValidEvent =
      data && typeof data === "object" && data.Event && data.Event.EventId;

    // We also double-check it's not a string (like that 429 HTML error)
    const isHtml = typeof data === "string" && data.includes("<html>");

    if (isValidEvent && !isHtml) {
      console.log("? Data valid, saving to Redis...");
      await redisClient.set(cacheKey, JSON.stringify(data), {
        EX: 800,
      });
    } else {
      console.warn("?? Received invalid data or HTML error page. NOT caching.");
    }
    return data;
  } catch (error) {
    console.error("Error in getEventDetail:", error.message);
    throw error; // Let the router handle the 500 response
  }
};

router.get("/timeOffset", async (req, res) => {
  return res.json(getServerTimeInNairobi().nairobiDotNetDate);
});

router.post("/events", async (req, res) => {
  try {
    const defaultBody = {
      sessionGuid: "chbera",
      operatorGuid: "churchura",
      name: "SteepleChase",
      feedId: 8080,
      userInitiated: true,
      offset: 10800,
      languageCode: "en",
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
      nextEventCount: "",
    };

    const payload = { ...defaultBody, ...req.body };

    // 1. Create a unique Cache Key based on the payload
    // We stringify it so different inputs get different cache entries
    const cacheKey = `events:${JSON.stringify(payload)}`;

    // 2. Try to get data from Redis
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log("Cache Hit! Returning data from Redis.");
      return res.json({
        success: true,
        data: JSON.parse(cachedData),
        source: "cache",
      });
    }

    // 3. Cache Miss: Call the external API
    console.log("Cache Miss. Calling external API...");
    const { data } = await axios.post(`${pley}/events`, payload, {
      headers: {
        Cookie: getKey(), // Ensure your cookie logic is still active
        "Content-Type": "application/json",
      },
    });

    // // 4. Save to Redis for 20 minutes (1200 seconds)
    // EX sets the expiration in seconds
    await redisClient.set(cacheKey, JSON.stringify(data), {
      EX: 1200,
    });

    res.json({ success: true, data, source: "api" });
  } catch (error) {
    const errorData = error?.response?.data || error.message;
    console.error("Error calling external API:", errorData);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: errorData,
    });
  }
});

router.post("/eventDetail", async (req, res) => {
  try {
    // Default body
    const defaultBody = {
      operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
      id: "12-1-8280146",
      userInitiated: false,
      offset: 10800,
      languageCode: "en",
      excludePlayerDetails: true,
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
    };

    // const defaultBody = {
    //   sessionGuid: "chbera",
    //   operatorGuid: "churchura",
    //   name: "SteepleChase",
    //   feedId: 8080,
    //   userInitiated: true,
    //   offset: 10800,
    //   languageCode: "en",
    //   bettingLayoutEnumValue: "1",
    //   primaryMarketClassIds: ["1", "2"],
    // };

    // // Merge request body with default
    const payload = { ...defaultBody, ...req.body };

    console.log(payload);

    // const { data } = await axios.post(
    //   "http://localhost:4000/event-detail",
    //   payload,
    // );

    const data = await getEventDetail(payload);

    // const res = await axios.post(`${url}/eventDetail`, payload, {
    //   headers: {
    //     // "Content-Type": "application/json",
    //     // Referer: "https://games2.pleybetman.com/",
    // Cookie: getKey(),
    //   },
    // });

    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "Error calling external API:",
      error?.response?.data || error.message,
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch event detail",
      error: error?.response?.data || error.message,
    });
  }
});

router.post("/combo", async (req, res) => {
  try {
    const body = req.body;

    // 1. Create a unique cache key based on the combo selections
    const cacheKey = `combo:${JSON.stringify(body)}`;

    // 2. Check Redis for existing data
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log("? Redis Hit: Combo Info");
      return res.json({
        success: true,
        data: JSON.parse(cachedData),
        source: "cache",
      });
    }

    console.log("?? Redis Miss: Fetching Combo Info from API...");

    // 3. Destructure { data } to avoid circular structure errors
    const { data } = await axios.post(`${pley}/combo`, body);

    // 4. Store the clean 'data' object in Redis for 20 minutes
    if (data) {
      await redisClient.set(cacheKey, JSON.stringify(data), {
        EX: 600,
      });
    }

    res.json({ success: true, data, source: "api" });
  } catch (error) {
    // Extracting the clean error message to avoid console clutter
    const errorMessage = error?.response?.data || error.message;
    console.error("Error calling Combo API:", errorMessage);

    res.status(500).json({
      success: false,
      message: "Failed to fetch combo bet info",
      error: errorMessage,
    });
  }
});

router.post("/placeBet", async (req, res) => {
  const connection = await db.getConnection();

  try {
    function hasTimePassed(dotNetDateString) {
      // const match = /\/Date\((\d+)\)\//.exec(dotNetDateString);
      // if (!match) throw new Error("Invalid date format");

      const a = Number(dotNetDateString.match(/\d+/)[0]);
      const b = Number(
        getServerTimeInNairobi().nairobiDotNetDate.match(/\d+/)[0],
      );

      return a > b;
    }

    await connection.beginTransaction();

    const { sessionId } = req.cookies;
    const username = req.body.username;
    const cashier = req.body.cashier;

    console.log("Session ID from cookies:", sessionId);

    if (!sessionId) {
      return res.json({ loggedIn: false, message: "No session cookie" });
    }

    const [checkSession] = await db.query(
      "SELECT userId, expiresAt FROM sessions WHERE sessionId = ?",
      [sessionId],
    );

    if (checkSession.length === 0) {
      return res.json({ loggedIn: false, message: "Invalid session" });
    }

    const session = checkSession[0];
    const sessionTime = new Date();

    if (new Date(session.expiresAt) < sessionTime) {
      await db.query("DELETE FROM sessions WHERE sessionId = ?", [sessionId]);
      res.clearCookie("sessionId", {
        httpOnly: true,
        secure: false, // true in production (HTTPS)
        sameSite: "Strict",
      });
      return res.json({
        expired: true,
        message: "Your session has expired. Please refresh or login again.",
      });
    }

    function dateTime2() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Fetch today's tickets
    const [balance] = await db.query(
      `SELECT * FROM ticket WHERE username = ? AND cashier = ? AND DATE(createdAt) = ?`,
      [username, cashier, dateTime2()],
    );

    // Compute totals
    const totals = balance.reduce(
      (acc, item) => {
        acc.bets += item.stake;
        if (item.isCancelled === 1) acc.cancellations += item.stake;
        if (item.isRedeemed === 1) acc.redeemed += item.stake * item.odd;
        return acc;
      },
      { bets: 0, cancellations: 0, redeemed: 0 },
    );

    const totalAmount =
      balance.length > 0
        ? totals.bets - totals.cancellations - totals.redeemed
        : 0;

    const [limit] = await db.query(
      "select balancelimit from users where user = ? and cashier = ?",
      [username, cashier],
    );
    if (totalAmount >= limit[0].balancelimit) {
      console.log(totalAmount, limit[0].balancelimit);
      return res.json({ limited: true });
    }

    const body = req.body.selectedBets;

    // console.log(body, "--------");
    // return;
    const a = [
      {
        id: "7186546",
        betType: "keno",
        gameName: "SmartPlayKeno",
        odd: 15,
        date: "2025/10/06 15:49:00",
        gameId: 9146,
        stake: 10,
        number: "",
        selectedNumbers: "10,20",
        stakeUpdated: false,
        displayName: "Win",
        longId: "83-19-7186546",
        maxOdd: 15,
      },
    ];

    let longg = body[0].longId;
    if (
      body[0].gameName === "PlatinumHounds" ||
      body[0].gameName === "DashingDerby" ||
      body[0].gameName === "SmartPlayKeno"
    ) {
      longg = body[0].longId;
    } else {
      longg = "8081-" + body[0].longId;
    }

    console.log(body[0].gameName, "Game", longg);

    const checkExpiration = longg;

    const defaultBody = {
      operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
      id: checkExpiration,
      userInitiated: false,
      offset: 10800,
      languageCode: "en",
      excludePlayerDetails: true,
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
    };

    // Call external API

    console.log(checkExpiration, defaultBody);

    // const { data } = await axios.post(
    //   "https://retail2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Cookie: getKey(),
    //     },
    //   },
    // );

    const data = await getEventDetail(defaultBody);
    //console.log(data);
    const isExpired = hasTimePassed(data.Event.AdjustedStartTime);
    if (!isExpired) {
      return res.json({
        timeExpired: true,
        message: "Expired bet.",
      });
    }
    const ticket = {
      Content: [],
    };

    function dateTime() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }

    function formatMySQLDate(d = new Date(), display = false) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      if (display)
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    const currentTime = dateTime();
    const createdAt = formatMySQLDate();

    const checkIfKeno = body.some(
      (b) =>
        b.betType === "keno" ||
        b.betType === "Evens" ||
        (b.betType === "Tails") | (b.betType === "Heads"),
    );

    function createTicket(ticketId = "121138755755478", bet) {
      const ticketTemplate = [
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: true,
          IsTerms: false,
          ImageFileType: "jpg",
          Underline: false,
        },
        {
          LineItem: ticketId,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: req.body.username,

          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: req.body.username + "." + req.body.cashier,

          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: currentTime,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
      ];
      ticket.Content.push(...ticketTemplate);

      let totalStake = 0;
      let payouts = [];

      bet.forEach((b) => {
        let gameName = null;
        if (b.gameName === "PlatinumHounds") gameName = "Greyhound Racing";
        else if (b.gameName === "DashingDerby") gameName = "Horse Racing";
        else if (b.gameName === "SpeedSkating") gameName = "Speed Skating";
        else if (b.gameName === "SteepleChase")
          gameName = "Steeple Chase Racing";
        else if (b.gameName === "MotorRacing") gameName = "Motor Racing";
        else if (b.gameName === "CycleRacing") gameName = "Track Racing";
        else if (b.gameName === "HarnessRacing") gameName = "Harness Racing";
        else if (b.gameName === "SingleSeaterMotorRacing")
          gameName = "SS Motor Racing";
        else if (b.gameName === "SmartPlayKeno") gameName = "Keno";

        // Build ticket content for combo or single bets
        if (b.isCombo) {
          const dynamicContent = [
            {
              LineItem: b.betType,
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: "Br " + b.stake + ".00",
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 2,
              NewLine: false,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `${gameName} ${b.date} #${b.gameId}`,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.data.MinNotation} (1 combo/s) `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.data.MinNotation} ${b.data.MinOdds}(Min) ${b.data.MaxNotation} ${b.data.MaxOdds}(Max) `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
          ];
          payouts.push(b.stake * b.data.MaxOdds);
          ticket.Content.push(...dynamicContent);
        } else if (
          b.betType === "keno" ||
          b.betType === "Heads" ||
          b.betType === "Tails" ||
          b.betType === "Evens"
        ) {
          const dynamicContent = [
            {
              LineItem: b.displayName,
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: "Br " + b.stake + ".00",
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 2,
              NewLine: false,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `${gameName} ${b.date} #${b.gameId}`,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.name} ${b.odd.toFixed(2)} `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
          ];
          payouts.push(b.stake * b.odd);
          ticket.Content.push(...dynamicContent);
        } else if (b.betType !== "keno") {
          const dynamicContent = [
            {
              LineItem: b.betType,
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: "Br " + b.stake + ".00",
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 2,
              NewLine: false,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `${gameName} ${b.date} #${b.gameId}`,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.name} ${b.odd.toFixed(2)} `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
          ];
          payouts.push(b.stake * b.odd);
          ticket.Content.push(...dynamicContent);
        }

        totalStake += b.stake;
      });

      const minPayout = checkIfKeno ? 10 : Math.min(...payouts);
      const maxPayout = Math.max(...payouts);

      const lowerBody = [
        {
          LineItem: "Total Stake",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${totalStake}.00`,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: "Min Payout (Incl. Stake)",
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: true,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${minPayout.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: "Max Payout (Incl. Stake)",
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${maxPayout.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `*${ticketId}*`,
          FontName: "BetManBarcode",
          FontSize: 11,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
      ];

      ticket.Content.push(...lowerBody);
    }

    // Fetch main ticket ID
    const [rows] = await connection.query(
      "SELECT nextTicketId FROM ticketcounter WHERE id = 1 FOR UPDATE;",
    );

    if (rows.length === 0) {
      return res.status(500).json({ success: false, message: "Failed" });
    }

    const mainTicketId = rows[0].nextTicketId;

    await connection.query(
      "UPDATE ticketcounter SET nextTicketId = nextTicketId + 1 WHERE id = 1",
    );

    let totalStake = 0;

    for (const b of body) {
      // Lock row for singleId
      const [single] = await connection.query(
        "SELECT nextTicketId FROM ticketcounter WHERE id = 2 FOR UPDATE;",
      );

      const singleId = single[0].nextTicketId;

      await connection.query(
        "UPDATE ticketcounter SET nextTicketId = nextTicketId + 1 WHERE id = 2",
      );

      let long = b.longId;
      if (
        b.gameName === "PlatinumHounds" ||
        b.gameName === "DashingDerby" ||
        b.gameName === "SmartPlayKeno"
      ) {
        long = b.longId;
      } else {
        long = "8081-" + b.longId;
      }
      console.log("LONGGG", long, b.gameName, b.longId);

      await connection.query(
        `INSERT INTO ticket
        (ticketId, singleId, username, cashier,eventId, longId, gameId,startingAt, betType, name, odd, number, stake, game,createdAt)
        VALUES (?, ?, ?, ?, ?,?, ?, ?,?, ?, ?, ?, ?, ?,?)`,
        [
          mainTicketId,
          singleId,
          username,
          cashier,
          b.id,
          long,
          b.gameId,
          b.date,
          b.betType,
          b.name,
          b.odd,
          b.number,
          b.stake,
          b.gameName,
          createdAt,
        ],
      );

      // await db.query(
      //   "UPDATE ticketcounter SET nextTicketId = nextTicketId + 1 WHERE id = 2;"
      // );
      totalStake += b.stake;
    }

    let gameName = null;

    if (body[0].gameName === "PlatinumHounds") gameName = "Greyhound Racing";
    else if (body[0].gameName === "DashingDerby") gameName = "Horse Racing";
    else if (body[0].gameName === "SpeedSkating") gameName = "Speed Skating";
    else if (body[0].gameName === "SteepleChase")
      gameName = "Steeple Chase Racing";
    else if (body[0].gameName === "MotorRacing") gameName = "Motor Racing";
    else if (body[0].gameName === "CycleRacing") gameName = "Track Racing";
    else if (body[0].gameName === "HarnessRacing") gameName = "Harness Racing";
    else if (body[0].gameName === "SingleSeaterMotorRacing")
      gameName = "SS Motor Racing";
    else if (body[0].gameName === "SmartPlayKeno") gameName = "Keno";

    await db.query(
      `INSERT INTO wholeticket
        (user,cashier, ticketId, stake,gameId,game, createdAt)
        VALUES (?,?, ?, ?, ?,?,?)`,
      [
        req.body.username,
        req.body.cashier,
        mainTicketId,
        totalStake,
        body[0].gameId,
        gameName,
        createdAt,
      ],
    );

    createTicket(String(rows[0].nextTicketId), body);

    // await db.query(
    //   "UPDATE ticketcounter SET nextTicketId = nextTicketId + 1 WHERE id = 1;"
    // );

    await connection.commit();

    res.json({
      success: true,
      data: ticket,
      limita: limit[0].balancelimit,
      totalAmount,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error inserting tickets:", error);
    res.status(500).json({ success: false, message: "Failed to save tickets" });
  } finally {
    connection.release();
  }
});

router.post("/print", async (req, res) => {
  try {
    const body = req.body;
    // Forward the request to the print service
    const response = await fetch("http://localhost:8080/PRINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Optionally, you can read response if needed
    // const data = await response.json();

    return res.json({
      success: true,
      data: "Printed successfully",
    });
  } catch (error) {
    console.error("Error printing:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to print slip",
    });
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const body = req.body;

    const { username, cashier } = req.body;

    // Helper to check if .NET date has passed
    function hasTimePassed(dotNetDateString) {
      // const match = /\/Date\((\d+)\)\//.exec(dotNetDateString);
      // if (!match) throw new Error("Invalid date format");

      // const timestamp = parseInt(match[1], 10);
      // const date = new Date(timestamp);
      // const now = new Date();

      // return date < now;

      // const match = /\/Date\((\d+)\)\//.exec(dotNetDateString);
      // if (!match) throw new Error("Invalid date format");

      const a = Number(dotNetDateString.match(/\d+/)[0]);
      const b = Number(
        getServerTimeInNairobi().nairobiDotNetDate.match(/\d+/)[0],
      );

      return a < b;
    }

    // Query ticket by ID
    const [rows] = await db.query("SELECT * FROM ticket WHERE ticketId = ?", [
      body.ticketId,
    ]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Bet slip not found" });
    }

    if (rows.every((r) => r.username !== username || r.cashier !== cashier)) {
      return res.json({
        success: false,
        message:
          "Betslip does not belong to the retailer you are logged in as.",
        aaa: "AAAAAA",
      });
    }

    const passed = rows.filter(
      (r) => r.username === username && r.cashier === cashier,
    );

    if (passed.some((r) => r.isCancelled == 1)) {
      return res.json({
        success: false,
        message: "Betslip previously cancelled.",
        aaa: "AAAAAA",
      });
    }

    const ID = passed[0].longId;

    const defaultBody = {
      operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
      id: ID,
      userInitiated: false,
      offset: 10800,
      languageCode: "en",
      excludePlayerDetails: true,
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
    };

    // Call external API
    // const { data } = await axios.post(
    //   "https://games2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     headers: {
    //       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    //       Accept: "application/json, text/javascript, */*; q=0.01",
    //       "Accept-Language": "en-US,en;q=0.9",
    //       Referer: "https://games2.pleybetman.com/",
    //       Origin: "https://games2.pleybetman.com",
    //       "Content-Type": "application/json",
    //       Connection: "keep-alive",
    //     },
    //     maxRedirects: 0, // <--- stop auto redirects
    //     validateStatus: null,
    //   }
    // );

    // const { data } = await axios.post(
    //   "https://games2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Referer: "https://games2.pleybetman.com/",
    //     },
    //   },
    // );
    const data = await getEventDetail(defaultBody);

    // const { data } = await axios.post(
    //   "https://retail2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",

    // Cookie: (getKey(),
    //     },
    //   }
    // );
    console.log("Date: ", data);
    const canCancel = hasTimePassed(data?.Event?.AdjustedStartTime);

    if (canCancel) {
      return res.json({
        success: false,
        message: "Too late to cancel, events started.",
      });
    }

    return res.json({ success: true, data: passed });
  } catch (error) {
    console.error(
      "Error reading tickets:",
      error?.response?.data || error.message,
    );
    throw new Error("Error reading tickets:", error);

    res.status(500).json({
      success: false,
      message: "Failed to read tickets",
      error: error?.response?.data || error.message,
    });
  }
});

router.post("/cancelBet", async (req, res) => {
  try {
    const body = req.body;
    const { username, cashier } = req.body;

    // Helper: check if .NET date has passed
    function hasTimePassed(dotNetDateString) {
      const match = /\/Date\((\d+)\)\//.exec(dotNetDateString);
      if (!match) throw new Error("Invalid date format");

      const timestamp = parseInt(match[1], 10);
      const date = new Date(timestamp);
      const now = new Date();

      return date < now;
    }

    function dateTime() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      return {
        date: `${year}/${month}/${day}`,
        time: `${hours}:${minutes}:${seconds}`,
      };
    }

    // Fetch ticket by ticketID
    const [check] = await db.query(
      "SELECT * FROM ticket WHERE ticketId = ? And username = ? and cashier = ?",
      [body.ticketID, username, cashier],
    );

    if (!check.length) {
      return res.json({ success: false, message: "Ticket not found" });
    }

    const ID = check[0].longId;
    console.log(check);

    const totalStake = check.reduce((sum, bet) => sum + bet.stake, 0);

    const defaultBody = {
      operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
      id: ID,
      userInitiated: false,
      offset: 10800,
      languageCode: "en",
      excludePlayerDetails: true,
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
    };

    console.log("Date: ", defaultBody);

    // Call external API
    // const {data} = await axios.post(
    //   "https://games2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     maxRedirects: 0, // ðŸš« stop redirect loop
    //     validateStatus: null, // donâ€™t throw automatically
    //     headers: {
    //       "Content-Type": "application/json",
    //       Referer: "https://games2.pleybetman.com/",
    //     },
    //   }
    // );

    // const { data } = await axios.post(
    //   "https://retail2.pleybetman.com/Home/GetEventDetail",
    //   defaultBody,
    //   {
    //     maxRedirects: 0, // ðŸš« stop redirect loop
    //     validateStatus: null, // donâ€™t throw automatically
    //     headers: {
    //       "Content-Type": "application/json",
    //       Referer: "https://games2.pleybetman.com/",
    //     },
    //   }
    // );

    // const canCancel = hasTimePassed(data.Event.AdjustedStartTime);

    // if (canCancel) {
    //   return res.json({
    //     success: false,
    //     message: "Too late to cancel, events started.",
    //   });
    // }

    // Update ticket as cancelled
    await db.query(
      "UPDATE ticket SET isCancelled = ?, cancelledBy =? WHERE ticketId = ? And username = ? and cashier = ?",
      [1, username + "." + cashier, body.ticketID, username, cashier],
    );

    const dt = dateTime();

    const cancelTicket = {
      Content: [
        {
          LineItem: username,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: username + "." + cashier,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: dt.date + " " + dt.time,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Cancel Receipt",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: body.ticketID,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Cancelled Amount:",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Br " + totalStake.toFixed(2),
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Cancelled Time:",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: dt.time,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
      ],
      OpenDrawer: true,
      PrintEndOfSlipIndicator: false,
      ErrorMessage: "",
      PrintWatermark: false,
      ID: 0,
    };

    return res.json({ success: true, cancelTicket });
  } catch (error) {
    console.error(
      "Error cancelling ticket:",
      error?.response?.data || error.message,
    );
    res.status(500).json({
      success: false,
      message: "Failed to cancel ticket",
      error: error?.response?.data || error.message,
    });
  }
});

router.post("/redeem", async (req, res) => {
  try {
    const body = req.body;
    const { username, cashier } = req.body;

    function hasTimePassed(dotNetDateString) {
      // const match = /\/Date\((\d+)\)\//.exec(dotNetDateString);
      // if (!match) throw new Error("Invalid date format");

      const a = Number(dotNetDateString.match(/\d+/)[0]);
      const b = Number(
        getServerTimeInNairobi().nairobiDotNetDate.match(/\d+/)[0],
      );

      return a > b;
    }

    const [rows] = await db.query(
      "SELECT * FROM ticket WHERE ticketId = ? and username =? and cashier = ?",
      [body.ticketId, username, cashier],
    );

    if (rows.length === 0)
      return res.json({ success: false, message: "Bet slip not found" });

    if (rows.every((r) => r.username !== username || r.cashier !== cashier)) {
      return res.json({
        success: false,
        message:
          "Betslip does not belong to the retailer you are logged in as.",
        aaa: "AAAAAA",
      });
    }

    const passed = rows.filter(
      (r) => r.username === username && r.cashier === cashier,
    );

    // console.log(passed, "passed");

    if (passed.some((r) => r.isCancelled == 1))
      return res.json({
        success: false,
        message: "Betslip previously cancelled.",
      });

    if (passed.some((r) => r.isRedeemed == 1))
      return res.json({
        success: false,
        message: "Betslip previously redeemed.",
      });

    const ID = passed[0].longId;
    const gameName = passed[0].game;

    const defaultBody = {
      operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
      id: ID,
      userInitiated: false,
      offset: 10800,
      languageCode: "en",
      excludePlayerDetails: true,
      bettingLayoutEnumValue: "1",
      primaryMarketClassIds: ["1", "2"],
    };

    console.log(ID, "defaultBody");

    const data = await getEventDetail(defaultBody);

    const canRedeem = hasTimePassed(data.Event.AdjustedFinishTime);

    console.log("Waitttttttt", canRedeem);

    if (canRedeem) {
      return res.json({
        success: false,
        message:
          "Partial redemption of a betslip is not allowed. Please wait for all events to result before attempting to redeem bets.",
      });
    }
    let isResult = null;

    if (gameName === "SmartPlayKeno") {
      console.log("kenooo");
      const cacheKey = `result:${ID}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`? Redis Hit for ID ${ID} 8888`, JSON.parse(cachedData));
        isResult = JSON.parse(cachedData);
      } else {
        try {
          const newPayload = {
            operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
            id: ID,
            userInitiated: false,
            offset: 10800,
            languageCode: "en",
            excludePlayerDetails: true,
            bettingLayoutEnumValue: "1",
            primaryMarketClassIds: ["1", "2"],
          };
          const { data } = await axios.post(`${pley}/event-detail`, newPayload);

          // const a = data?.Event?.Race?.Result
          const a = data?.Event?.Markets[0]?.WinningSelectionID;
          if (a && a !== null) {
            isResult = a;
            await redisClient.set(cacheKey, JSON.stringify(isResult), {
              EX: 9000, // 20 minute
            });
          }
        } catch (error) {
          console.error("Error fetching event detail for Keno:", error);
          return res.json({
            success: false,
            message:
              "Partial redemption of a betslip is not allowed. Please wait for all events to result before attempting to redeem bets.",
          });
        }
      }
    } else if (
      gameName === "DashingDerby" ||
      gameName === "PlatinumHounds" ||
      gameName === "HarnessRacing" ||
      gameName === "SingleSeaterMotorRacing" ||
      gameName === "CycleRacing" ||
      gameName === "SteepleChase" ||
      gameName === "SpeedSkating" ||
      gameName === "MotorRacing"
    ) {
      const cacheKey = `result:${ID}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`? Redis Hit for ID ${ID}`);
        isResult = JSON.parse(cachedData);
      } else {
        try {
          const newPayload = {
            operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
            id: ID,
            userInitiated: false,
            offset: 10800,
            languageCode: "en",
            excludePlayerDetails: true,
            bettingLayoutEnumValue: "1",
            primaryMarketClassIds: ["1", "2"],
          };
          const { data } = await axios.post(`${pley}/event-detail`, newPayload);
          console.log(
            data?.Event?.Race?.Result.split(",").map(Number).slice(0, 3),
          );
          const a = data?.Event?.Race?.Result
            ? data.Event.Race.Result.split(",").map(Number).slice(0, 3)
            : null;
          if (a && a !== null) {
            isResult = a;
            await redisClient.set(cacheKey, JSON.stringify(isResult), {
              EX: 9000, // 20 minutes
            });
          }
        } catch (error) {
          console.error("Error fetching event detail for Keno:", error);
          return res.json({
            success: false,
            message:
              "Partial redemption of a betslip is not allowed. Please wait for all events to result before attempting to redeem bets.",
          });
        }
      }
    } else {
      const cacheKey = `result:${ID}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`? Redis Hit for ID ${ID}`);
        isResult = JSON.parse(cachedData);
      } else {
        const result = await axios.get(`${pley}/result?id=${ID}`, {
          timeout: 10000,
          validateStatus: () => true,
        });
        console.log(result.data);
        isResult = extractWinNumbersFromHTML(result.data);
        if (isResult && isResult.length > 0) {
          console.log(`? Valid result found. Saving ID ${ID} to Redis.`);
          await redisClient.set(cacheKey, JSON.stringify(isResult), {
            EX: 9000, // 20 minutes
          });
        }
      }
    }

    let PlacePaysOn = null;

    if (rows.some((r) => r.betType === "keno")) {
      //isResult = data.Event.Markets[0].WinningSelectionID;
    } else {
      // isResult = data.Event.Race.Result;
      PlacePaysOn = data.Event.Race.PlacePaysOn;
    }

    console.log(isResult, "isResult");

    if (isResult === null || isResult.length === 0) {
      return res.json({
        success: false,
        message:
          "Partial redemption of a betslip is not allowed. Please wait for all events to result before attempting to redeem bets.",
      });
    }

    if (rows.some((r) => r.betType === "keno")) {
      return res.json({
        success: true,
        data: {
          rows: passed,
          isResult,
          type: "keno",
        },
      });
    } else {
      const numbers = isResult.map(String);

      return res.json({
        success: true,
        data: { rows: passed, numbers, PlacePaysOn },
      });
    }
  } catch (error) {
    console.error("Error reading tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to read tickets",
    });
  }
});

function kenoWinChecker(ticketNumbers, winNumbers) {
  const matchCount = ticketNumbers.filter((n) => winNumbers.includes(n)).length;
  const length = ticketNumbers.length;

  const payoutTable = {
    1: { 1: 3.8 },
    2: { 2: 15 },
    3: { 3: 35, 2: 3 },
    4: { 4: 100, 3: 8, 2: 1 },
    5: { 5: 300, 4: 15, 3: 3, 2: 1 },
    6: { 6: 1800, 5: 70, 4: 10, 3: 1 },
    7: { 7: 2150, 6: 120, 5: 12, 4: 6, 3: 1, 0: 1 },
    8: { 8: 3000, 7: 600, 6: 68, 5: 8, 4: 4, 0: 1 },
    9: { 9: 4200, 8: 1800, 7: 120, 6: 18, 5: 6, 4: 3, 0: 1 },
    10: { 10: 5000, 9: 2500, 8: 400, 7: 140, 6: 12, 5: 4, 4: 2, 0: 1 },
  };

  return payoutTable[length]?.[matchCount] ?? 0;
}

router.post("/redeemBet", async (req, res) => {
  try {
    const body = req.body;
    const { username, cashier, type } = req.body;

    // let a = body.winners[0];

    function dateTime() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      return {
        date: `${year}/${month}/${day}`,
        time: `${hours}:${minutes}:${seconds}`,
      };
    }

    const dt = dateTime();

    if (type === "keno") {
      for (const id of body.winners) {
        const [a] = await db.query(
          "select name,longId from ticket  where  singleId = ?",
          [id],
        );

        // console.log(a, "aaaaaaaaaa");

        const newPayload = {
          operatorGuid: "5a7d8ed1-2de8-4314-a4fd-dcf651f0c552",
          id: a[0].longId,
          userInitiated: false,
          offset: 10800,
          languageCode: "en",
          excludePlayerDetails: true,
          bettingLayoutEnumValue: "1",
          primaryMarketClassIds: ["1", "2"],
        };

        //   // Merge request body with default
        // const payload = { ...newPayload };

        // Call external API
        // const result = await axios.post(
        //   "https://games2.pleybetman.com/Home/GetEventDetail",
        //   newPayload,
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       Referer: "https://games2.pleybetman.com/",
        //     },
        //   },
        // );
        let isResult = null;
        // const result = await getEventDetail(newPayload);
        const cacheKey = `result:${a[0].longId}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
          console.log(`? Redis Hit for ID ${a[0].longId}`);
          isResult = JSON.parse(cachedData);
        } else {
          const { data } = await axios.post(`${pley}/event-detail`, body);
          isResult = data.Event.Markets[0].WinningSelectionID;
        }

        // const result = await axios.post(
        //   "https://retail2.pleybetman.com/Home/GetEventDetail",
        //   newPayload,
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       Referer: "https://games2.pleybetman.com/",
        // Cookie: getKey(),
        //     },
        //   }
        // );

        //isResult = result.Event.Markets[0].WinningSelectionID;
        const ticketNumbers = a[0].name.split(",").map(Number);
        const winNumbers = isResult.split(",").map(Number);

        const odd = kenoWinChecker(ticketNumbers, winNumbers);

        console.log(ticketNumbers, winNumbers, odd, "odd");

        await db.query(
          "UPDATE ticket SET isRedeemed = ?, odd = ?,redeemedBy=?,unclaimed=0 WHERE singleId = ?",
          [1, odd, username + "." + cashier, id],
        );
      }
    } else {
      console.log(body.winners);
      for (const id of body.winners) {
        await db.query(
          "UPDATE ticket SET isRedeemed = ?,redeemedBy=?,unclaimed=0 WHERE singleId = ?",
          [1, username + "." + cashier, id],
        );
      }
    }

    const [check] = await db.query(
      "select * from ticket where ticketId = ? and isRedeemed = 1",
      [body.ticketID],
    );

    const totalWin = check.reduce((sum, bet) => sum + bet.stake * bet.odd, 0);

    let ticket = {
      Content: [
        {
          LineItem: username,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: username + "." + cashier,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: dt.date + " " + dt.time,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Redeem Receipt",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: body.ticketID,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Redeemed Amount:",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Br " + totalWin.toFixed(2),
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Redeemed Time:",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: dt.time,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Winning Bets",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
      ],
      OpenDrawer: true,
      PrintEndOfSlipIndicator: false,
      ErrorMessage: "",
      PrintWatermark: false,
      ID: 0,
    };

    for (const c of check) {
      let gameName = null;
      if (c.game === "PlatinumHounds") gameName = "Greyhound Racing";
      else if (c.game === "SmartPlayKeno") gameName = "Keno";
      else if (c.game === "DashingDerby") gameName = "Horse Racing";
      else if (c.game === "SpeedSkating") gameName = "Speed Skating";
      else if (c.game === "SteepleChase") gameName = "Steeple Chase Racing";
      else if (c.game === "MotorRacing") gameName = "Motor Racing";
      else if (c.game === "CycleRacing") gameName = "Track Racing";
      else if (c.game === "HarnessRacing") gameName = "Harness Racing";
      else if (c.game === "SingleSeaterMotorRacing")
        gameName = "SS Motor Racing";

      let left = [
        {
          LineItem: c.betType === "keno" ? "Win" : c.betType,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br ${c.stake.toFixed(2)} `,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `${gameName} ${c.startingAt} #${c.gameId}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `    ${c.name} ${c.odd} `,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
      ];
      ticket.Content.push(...left);
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error("Error updating tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update tickets",
    });
  }
});

router.post("/getBalance", async (req, res) => {
  try {
    // const { username } = req.body;
    // if (!username) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Username is required" });
    // }
    const { username, cashier } = req.body;
    console.log(username);
    function dateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Fetch today's tickets
    const [rows] = await db.query(
      `SELECT * FROM ticket WHERE username = ? AND cashier = ? AND DATE(createdAt) = ?`,
      [username, cashier, dateTime()],
    );

    // Compute totals
    const totals = rows.reduce(
      (acc, item) => {
        acc.bets += item.stake;
        if (item.isCancelled === 1) acc.cancellations += item.stake;
        if (item.isRedeemed === 1) acc.redeemed += item.stake * item.odd;
        return acc;
      },
      { bets: 0, cancellations: 0, redeemed: 0 },
    );

    const totalAmount =
      rows.length > 0
        ? totals.bets - totals.cancellations - totals.redeemed
        : 0;

    res.json({ success: true, totalAmount });
  } catch (error) {
    console.error("Error fetching today's bets:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bets",
      error: error.message,
    });
  }
});

router.post("/getBalanceData", async (req, res) => {
  try {
    const { username, cashier } = req.body;

    function formatDate(date) {
      const pad = (n) => String(n).padStart(2, "0");
      return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        " " +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds())
      );
    }
    const now = new Date();

    // Yesterday start (00:00:00)
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
    );

    // Today end (23:59:59)
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const start = formatDate(yesterdayStart);
    const end = formatDate(todayEnd);

    const [rows] = await db.query(
      "SELECT * FROM ticket WHERE username = ?  AND cashier = ? AND createdAt BETWEEN ? AND ?",
      [username, cashier, start, end],
    );

    // --- 1. Helper: get all dates between start and end ---
    function getDateRange(startDate, endDate) {
      const dates = [];

      // Strip time part
      const start = new Date(startDate.split(" ")[0]);
      const end = new Date(endDate.split(" ")[0]);

      let d = start;
      while (d <= end) {
        dates.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }

      return dates;
    }

    const dateRange = getDateRange(start, end);

    // --- 2. Initialize accumulator with 0s for all days ---
    const acc = {};
    for (const day of dateRange) {
      acc[day] = {
        date: day,
        bets: 0,
        cancellations: 0,
        redeemed: 0,
        unclaimed: 0,
      };
    }

    // --- 3. Fill in actual DB data ---
    (rows ?? []).forEach((item) => {
      const d = item.createdAt;
      const dateKey =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          bets: 0,
          cancellations: 0,
          redeemed: 0,
          unclaimed: 0,
        };
      }

      acc[dateKey].bets += item.stake ?? 0;
      if (item.isCancelled === 1) acc[dateKey].cancellations += item.stake ?? 0;
      if (item.isRedeemed === 1)
        acc[dateKey].redeemed += (item.stake ?? 0) * Number(item.odd ?? 0);
      if (item.unclaimed === 1) {
        acc[dateKey].unclaimed += (item.stake ?? 0) * Number(item.odd ?? 0);
      }
    });

    const totals = Object.values(acc);

    res.json(totals); // return exactly what original handler returned
  } catch (error) {
    console.error("Error fetching bets summary:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bets summary",
      error: error.message,
    });
  }
});

router.post("/recallBets", async (req, res) => {
  try {
    const { username, cashier } = req.body;

    // Helper: get current date (unused but kept as in original)
    function dateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const [rows] = await db.query(
      "SELECT * FROM wholeticket WHERE user = ? and cashier = ? ORDER BY id DESC LIMIT 10",
      [username, cashier],
    );

    res.json(rows.length > 0 ? rows : []);
  } catch (error) {
    console.error("Error fetching latest wholetickets:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wholetickets",
      error: error.message,
    });
  }
});

router.post("/copyPrint", async (req, res) => {
  try {
    const body = req.body;
    const { username, cashier } = req.body;

    const [rows] = await db.query("SELECT * FROM ticket WHERE ticketId = ?", [
      body.ticketId,
    ]);

    const ticket = {
      Content: [],
      OpenDrawer: true,
      PrintEndOfSlipIndicator: false,
      ErrorMessage: "",
      PrintWatermark: true,
      ID: 0,
    };

    function dateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }

    const currentTime = dateTime();

    function createTicket(ticketId = "121138755755478", bet) {
      const ticketTemplate = [
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: true,
          IsTerms: false,
          ImageFileType: "jpg",
          Underline: false,
        },
        {
          LineItem: ticketId,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: username,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: username + "." + cashier,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: currentTime,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
      ];

      ticket.Content.push(...ticketTemplate);

      let totalStake = 0;
      let payouts = [];

      bet.forEach((b) => {
        let game = null;
        if (b.game === "PlatinumHounds") {
          game = "Greyhound Racing";
        } else if (b.game === "DashingDerby") {
          game = "Horse Racing";
        } else if (b.game === "SpeedSkating") {
          game = "Speed Skating";
        } else if (b.game === "SteepleChase") {
          game = "Steeple Chase Racing";
        } else if (b.game === "MotorRacing") {
          game = "Motor Racing";
        } else if (b.game === "CycleRacing") {
          game = "Track Racing";
        } else if (b.game === "HarnessRacing") {
          game = "Harness Racing";
        } else if (b.game === "SingleSeaterMotorRacing") {
          game = "SS Motor Racing";
        }
        if (b.betType !== "Win" && b.betType !== "Place") {
          const dynamicContent = [
            {
              LineItem: b.betType,
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: "Br " + b.stake + ".00",
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 2,
              NewLine: false,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `${game} ${b.startingAt} #${b.gameId}`,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.name} (1 combo/s) `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.name} ${b.odd}(Min) ${b.name} ${b.odd}(Max) `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
          ];
          payouts.push(b.stake * b.odd);
          ticket.Content.push(...dynamicContent);
        } else {
          const dynamicContent = [
            {
              LineItem: b.betType,
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: "Br " + b.stake + ".00",
              FontName: "Arial",
              FontSize: 8,
              Bold: true,
              Italic: false,
              Alignment: 2,
              NewLine: false,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `${game} ${b.startingAt} #${b.gameId}`,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: `    ${b.name} ${b.odd} `,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
            {
              LineItem: null,
              FontName: "Arial",
              FontSize: 8,
              Bold: false,
              Italic: false,
              Alignment: 0,
              NewLine: true,
              PartOfHeader: false,
              PrintDoubleBlock: false,
              RowsInDoubleBlock: 2,
              IsImage: false,
              IsTerms: false,
              ImageFileType: null,
              Underline: false,
            },
          ];
          payouts.push(b.stake * b.odd);
          ticket.Content.push(...dynamicContent);
        }

        totalStake += b.stake;
      });

      const minPayout = Math.min(...payouts);
      const maxPayout = Math.max(...payouts);

      const lowerBody = [
        {
          LineItem: "Total Stake",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${totalStake}.00`,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: "Min Payout (Incl. Stake)",
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: true,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${minPayout.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: "Max Payout (Incl. Stake)",
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: `Br ${maxPayout.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },

        {
          LineItem: ".",
          FontName: "Arial",
          FontSize: 5,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: true,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `*${ticketId}*`,
          FontName: "BetManBarcode",
          FontSize: 11,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: ".",
          FontName: "Arial",
          FontSize: 5,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: true,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
      ];
      ticket.Content.push(...lowerBody);
    }

    createTicket(String(body.ticketId), rows);

    return res.json(ticket);
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate ticket",
      error: error.message,
    });
  }
});

router.post("/printZReport", async (req, res) => {
  try {
    const body = req.body;

    const { username, cashier } = req.body;

    // Utility functions for dates
    const dateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const dateTime2 = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const [rows] = await db.query(
      `SELECT * FROM ticket WHERE username = ? AND cashier = ?  AND DATE(createdAt) = '${body.day}'`,
      [body.username, body.cashier],
    );
    const totals = rows.reduce(
      (acc, item) => {
        acc.bets += item.stake;

        if (item.isCancelled === 1) {
          acc.cancellations += item.stake;
        }

        if (item.isRedeemed === 1) {
          acc.redeemed += item.stake * item.odd;
        }

        return acc;
      },
      { bets: 0, cancellations: 0, redeemed: 0 },
    );

    const zReport = {
      Content: [
        {
          LineItem: username,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: username + "." + cashier,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `${dateTime2()}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: true,
          PartOfHeader: true,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Cash Summary" + "(" + username + "." + cashier + ")",
          FontName: "Arial",
          FontSize: 9,
          Bold: true,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `${dateTime()} 00:00:00 - ${dateTime()} 23:59:59`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 1,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: null,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Start Balance",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br. ${0.0}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Deposits",
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Br 0.00",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Bets",
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br. ${totals.bets.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Cancellations",
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br. ${totals.cancellations.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Redeemed",
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br. ${totals.redeemed.toFixed(2)}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Withdraws",
          FontName: "Arial",
          FontSize: 8,
          Bold: false,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "Br 0.00",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: "End Balance",
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 0,
          NewLine: true,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
        {
          LineItem: `Br. ${(
            totals.bets -
            totals.cancellations -
            totals.redeemed
          ).toFixed(2)}`,
          FontName: "Arial",
          FontSize: 8,
          Bold: true,
          Italic: false,
          Alignment: 2,
          NewLine: false,
          PartOfHeader: false,
          PrintDoubleBlock: false,
          RowsInDoubleBlock: 2,
          IsImage: false,
          IsTerms: false,
          ImageFileType: null,
          Underline: false,
          IsJackpotLine: false,
          DisplayInline: false,
        },
      ],
      OpenDrawer: false,
      PrintEndOfSlipIndicator: false,
      ErrorMessage: "",
      PrintWatermark: false,
      ID: 0,
    };

    return res.json({ success: true, data: zReport });
  } catch (error) {
    console.error("Error generating zReport:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Z report",
    });
  }
});

router.post("/results", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM games ORDER BY id DESC LIMIT 10",
    );

    return res.json({ success: true, rows });
  } catch (error) {
    console.log(error);
  }
});

router.post("/searchResults", async (req, res) => {
  try {
    const { gameid } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM games where gameid = ? order by id desc limit 1",
      [gameid],
    );

    return res.json({ success: true, rows });
  } catch (error) {
    console.log(error);
  }
});

router.post("/printResult", async (req, res) => {
  try {
    const { username, cashier, eventid } = req.body;

    const [rows] = await db.query("SELECT * FROM games where eventid = ?", [
      eventid,
    ]);

    function dateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }

    const currentTime = dateTime();

    function stringToArray(str) {
      return str.split(",").map(Number);
    }

    const winners = stringToArray(rows[0].result);

    console.log(winners);

    let ticket = null;

    if (rows[0].gamename === "SmartPlayKeno") {
      ticket = {
        Content: [
          {
            LineItem: username,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: username + "." + cashier,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: currentTime,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Event Result",
            FontName: "Arial",
            FontSize: 9,
            Bold: true,
            Italic: false,
            Alignment: 1,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Game",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].gamename,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Event ID",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].gameid,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Time",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].date,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].result,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },

          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
        ],
        OpenDrawer: false,
        PrintEndOfSlipIndicator: true,
        ErrorMessage: "",
        PrintWatermark: false,
        ID: 0,
      };
    } else {
      ticket = {
        Content: [
          {
            LineItem: username,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: username + "." + cashier,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: currentTime,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 2,
            NewLine: true,
            PartOfHeader: true,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Event Result",
            FontName: "Arial",
            FontSize: 9,
            Bold: true,
            Italic: false,
            Alignment: 1,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Game",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].gamename,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Event ID",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].gameid,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: "Time",
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].date,
            FontName: "Arial",
            FontSize: 8,
            Bold: true,
            Italic: false,
            Alignment: 2,
            NewLine: false,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].first,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].second,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: rows[0].third,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: `Last: ${winners[winners.length - 1]} ,  Last 3: ${
              winners[winners.length - 1]
            } ,${winners[winners.length - 2]} ,${winners[winners.length - 3]} `,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
          {
            LineItem: null,
            FontName: "Arial",
            FontSize: 8,
            Bold: false,
            Italic: false,
            Alignment: 0,
            NewLine: true,
            PartOfHeader: false,
            PrintDoubleBlock: false,
            RowsInDoubleBlock: 2,
            IsImage: false,
            IsTerms: false,
            ImageFileType: null,
            Underline: false,
            IsJackpotLine: false,
            DisplayInline: false,
          },
        ],
        OpenDrawer: false,
        PrintEndOfSlipIndicator: true,
        ErrorMessage: "",
        PrintWatermark: false,
        ID: 0,
      };
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    console.log(error);
  }
});

router.post("/changePassword", async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, username, cashier } =
    req.body;

  const [password] = await db.query(
    "select password from users where user =? AND cashier = ?",
    [username, cashier],
  );
  console.log(password, String(currentPassword));

  if (
    currentPassword === null ||
    currentPassword === "" ||
    String(currentPassword) !== password[0].password
  ) {
    res.json({
      success: false,
      message: "Old password is incorrect",
    });
    return;
  }

  if (
    newPassword === null ||
    newPassword === "" ||
    confirmPassword === null ||
    confirmPassword === ""
  ) {
    res.json({
      success: false,
      message: "All fields are required",
    });
    return;
  }
});

export default router;
