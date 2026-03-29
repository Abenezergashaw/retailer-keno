<script setup>
import { ref, computed, watch } from "vue";
import LockIcon from "./LockIcon.vue";
import ComboBox from "./ComboBox.vue";
import Rating from "./Rating.vue";
const props = defineProps({
  eventDetail: {
    type: Object,
  },
  finished: {
    type: Boolean,
  },
  trackingSelectedNumbers: {
    type: Array,
  },
  imageDir: Array,
  comboSelections: Object,
  placingBet: Boolean,
});

const emit = defineEmits();

// console.log("Single", props.eventDetail);

const checkIfNumberSelectedForCombo = (number, a) => {
  let n = null;
  let c = null;
  let s = false;
  let sup = null;
  if (props.comboSelections[a]?.length <= 3) {
    const index = props.comboSelections[a]?.findIndex(
      (item) => number === item
    );
    if (index !== -1) {
      n = index + 1;
      c = "bg-[#257832] text-[#eee] font-light";
      s = true;
      index === 0
        ? (sup = "st")
        : index === 1
        ? (sup = "nd")
        : index === 2
        ? (sup = "rd")
        : "";
    } else {
      n = number;
      c =
        "text-[#8c8c8c] bg-[#fcfcfc] hover:bg-[#37B34A] font-medium hover:text-[#111]";
      s = false;
      sup = "";
    }
  } else if (props.comboSelections[a]?.length > 3) {
    const index = props.comboSelections[a]?.findIndex(
      (item) => number === item
    );
    if (index !== -1) {
      n = number;
      c = "bg-[#257832] text-[#eee] ";
      s = true;
    } else {
      n = number;
      c =
        "text-[#8c8c8c] bg-[#fcfcfc] hover:bg-[#37B34A] font-semibold hover:text-[#111]";
      s = false;
      sup = "";
    }
  } else {
    n = number;
    c =
      "text-[#8c8c8c] bg-[#fcfcfc] hover:bg-[#37B34A] font-semibold hover:text-[#111]";
    s = false;
    sup = "";
  }
  return { n, c, s, sup };
};

let quinela = ref(null);
let exact = ref(null);
let swinger = ref(null);
let trio = ref(null);
let trifecta = ref(null);

const comboCalculator = (a) => {
  // console.log(a);
  if (props.comboSelections[a]?.length === 2) {
    quinela.value = 1;
    swinger.value = 1;
    exact.value = 1;
  } else if (props.comboSelections[a]?.length === 3) {
    quinela.value = 3;
    swinger.value = 3;
    exact.value = 3;
    trio.value = 1;
    trifecta.value = 1;
  } else if (props.comboSelections[a]?.length > 3) {
    quinela.value =
      (props.comboSelections[a]?.length *
        (props.comboSelections[a]?.length - 1)) /
      2;

    exact.value =
      props.comboSelections[a]?.length * (props.comboSelections[a]?.length - 1);

    swinger.value =
      (props.comboSelections[a]?.length *
        (props.comboSelections[a]?.length - 1)) /
      2;
    trio.value =
      (props.comboSelections[a]?.length *
        (props.comboSelections[a]?.length - 1) *
        (props.comboSelections[a]?.length - 2)) /
      6;

    trifecta.value =
      props.comboSelections[a]?.length *
      (props.comboSelections[a]?.length - 1) *
      (props.comboSelections[a]?.length - 2);
  }
};
comboCalculator(props.eventDetail.Event.EventId);
const a = {
  Event: {
    FeedId: 12,
    EventId: "8261307",
    ParentEventId: null,
    TypeValue: 2,
    BettingLayoutEnumValue: 0,
    TypeName: "PlatinumHounds",
    SubTypeName: "None",
    StartDateTimeAsWords: "2025/08/19 18:41:00",
    StartTimeAsWords: "18:41",
    FinishTimeAsWords: "18:41",
    Race: {
      Name: "Summerset Park",
      PlacePaysOn: 3,
      Distance: 360,
      Entries: [
        {
          FeedId: 433,
          Draw: 1,
          Name: "Oscar",
          Finish: null,
          Form: "6,5,6,2,2",
          LBW: "5.5;4.5;7.5;1.5;0.8",
          StarRating: 41,
          RacesSinceWin: 7,
          RacesSincePlace: 0,
          WinOdds: 18.04,
          PlaceOdds: 3.21,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "29",
          DisplayFinish: 99,
          LBWAsArray: [5.5, 4.5, 7.5, 1.5, 0.8],
          InverseRating: 49,
          Description: "1. Oscar",
          Favorite: null,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 433,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 331,
          Draw: 2,
          Name: "Blitz",
          Finish: null,
          Form: "2,6,7,6,2",
          LBW: "1.0;5.3;6.4;5.6;1.1",
          StarRating: 47,
          RacesSinceWin: 8,
          RacesSincePlace: 0,
          WinOdds: 11.91,
          PlaceOdds: 2.7,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "23",
          DisplayFinish: 99,
          LBWAsArray: [1, 5.3, 6.4, 5.6, 1.1],
          InverseRating: 41,
          Description: "2. Blitz",
          Favorite: null,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 331,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 11,
          Draw: 3,
          Name: "Nitrox",
          Finish: null,
          Form: "2,6,3,1,1",
          LBW: "1.4;4.8;2.1;0;0",
          StarRating: 65,
          RacesSinceWin: 0,
          RacesSincePlace: 0,
          WinOdds: 2.47,
          PlaceOdds: 1.4,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "01",
          DisplayFinish: 99,
          LBWAsArray: [1.4, 4.8, 2.1, 0, 0],
          InverseRating: 19,
          Description: "3. Nitrox",
          Favorite: 1,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 11,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 297,
          Draw: 4,
          Name: "Mighty Snazy",
          Finish: null,
          Form: "8,2,8,8,5",
          LBW: "7.7;1.5;7.2;6.9;4.9",
          StarRating: 44,
          RacesSinceWin: 13,
          RacesSincePlace: 3,
          WinOdds: 10.21,
          PlaceOdds: 2.54,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "20",
          DisplayFinish: 99,
          LBWAsArray: [7.7, 1.5, 7.2, 6.9, 4.9],
          InverseRating: 45,
          Description: "4. Mighty Snazy",
          Favorite: null,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 297,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 174,
          Draw: 5,
          Name: "Regent Prince",
          Finish: null,
          Form: "3,3,4,6,5",
          LBW: "2.5;2.7;4.5;5.8;4.5",
          StarRating: 53,
          RacesSinceWin: 11,
          RacesSincePlace: 3,
          WinOdds: 5.56,
          PlaceOdds: 1.97,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "12",
          DisplayFinish: 99,
          LBWAsArray: [2.5, 2.7, 4.5, 5.8, 4.5],
          InverseRating: 34,
          Description: "5. Regent Prince",
          Favorite: 3,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 174,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 515,
          Draw: 6,
          Name: "Crumpets And Tea",
          Finish: null,
          Form: "5,6,1,2,2",
          LBW: "4.0;6.4;0;1.0;1.2",
          StarRating: 43,
          RacesSinceWin: 2,
          RacesSincePlace: 0,
          WinOdds: 23.52,
          PlaceOdds: 3.59,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "35",
          DisplayFinish: 99,
          LBWAsArray: [4, 6.4, 0, 1, 1.2],
          InverseRating: 46,
          Description: "6. Crumpets And Tea",
          Favorite: null,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 515,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 124,
          Draw: 7,
          Name: "Max Million",
          Finish: null,
          Form: "1,2,4,4,1",
          LBW: "0;0.9;4.2;3.9;0",
          StarRating: 54,
          RacesSinceWin: 0,
          RacesSincePlace: 0,
          WinOdds: 4.31,
          PlaceOdds: 1.78,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "09",
          DisplayFinish: 99,
          LBWAsArray: [0, 0.9, 4.2, 3.9, 0],
          InverseRating: 32,
          Description: "7. Max Million",
          Favorite: 2,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 124,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
        {
          FeedId: 542,
          Draw: 8,
          Name: "Sun Block",
          Finish: null,
          Form: "7,5,7,6,7",
          LBW: "6.4;4.3;7.4;6.2;6.3",
          StarRating: 35,
          RacesSinceWin: 39,
          RacesSincePlace: 5,
          WinOdds: 25.23,
          PlaceOdds: 3.7,
          ShowOdds: 0,
          SecondOdds: 0,
          ThirdOdds: 0,
          LastOdds: 0,
          Last3Odds: 0,
          Gender: null,
          Age: null,
          SilkImagePath: null,
          SilkNumber: "37",
          DisplayFinish: 99,
          LBWAsArray: [6.4, 4.3, 7.4, 6.2, 6.3],
          InverseRating: 56,
          Description: "8. Sun Block",
          Favorite: null,
          BallAllocations: null,
          BallsDrawn: null,
          ID: 542,
          HasErrorOccured: false,
          ErrorMessage: null,
        },
      ],
      Result: null,
      KenoFeedID: 0,
      KenoResult: null,
      NoOfParticipants: null,
      ID: 0,
      HasErrorOccured: false,
      ErrorMessage: null,
    },
    Boxing: null,
    PlayerVsPlayer: null,
    Archery: null,
    FootballMatch: null,
    FootballTournamentMatch: null,
    RacingRouletteV2: null,
    SpinAndWin: null,
    FootballLeagueWeek: null,
    IceHockeyMatch: null,
    FinalHoopsMatch: null,
    PrimaryMarkets: [
      {
        FeedId: "Win",
        Name: "Win",
        Abbreviation: null,
        ClassValue: 1,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: 1,
            Second: null,
            Third: null,
            FeedId: "1",
            Odds: 18.04,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "1. Oscar",
            DisplayDescription: "1. Oscar",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 2,
            Second: null,
            Third: null,
            FeedId: "2",
            Odds: 11.91,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "2. Blitz",
            DisplayDescription: "2. Blitz",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 3,
            Second: null,
            Third: null,
            FeedId: "3",
            Odds: 2.47,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "3. Nitrox",
            DisplayDescription: "3. Nitrox",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 4,
            Second: null,
            Third: null,
            FeedId: "4",
            Odds: 10.21,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "4. Mighty Snazy",
            DisplayDescription: "4. Mighty Snazy",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 5,
            Second: null,
            Third: null,
            FeedId: "5",
            Odds: 5.56,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "5. Regent Prince",
            DisplayDescription: "5. Regent Prince",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 6,
            Second: null,
            Third: null,
            FeedId: "6",
            Odds: 23.52,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "6. Crumpets And Tea",
            DisplayDescription: "6. Crumpets And Tea",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 7,
            Second: null,
            Third: null,
            FeedId: "7",
            Odds: 4.31,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "7. Max Million",
            DisplayDescription: "7. Max Million",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 8,
            Second: null,
            Third: null,
            FeedId: "8",
            Odds: 25.23,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "8. Sun Block",
            DisplayDescription: "8. Sun Block",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: true,
        ClassEnumValue: "Win",
        MarketClassID: 1,
        DisplayDescription: "Win",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 1,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 1,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Win",
        ID: "12-2-8261307-1",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: "Place",
        Name: "Place",
        Abbreviation: null,
        ClassValue: 2,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: 1,
            Second: null,
            Third: null,
            FeedId: "1",
            Odds: 3.21,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "1. Oscar",
            DisplayDescription: "1. Oscar",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 2,
            Second: null,
            Third: null,
            FeedId: "2",
            Odds: 2.7,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "2. Blitz",
            DisplayDescription: "2. Blitz",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 3,
            Second: null,
            Third: null,
            FeedId: "3",
            Odds: 1.4,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "3. Nitrox",
            DisplayDescription: "3. Nitrox",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 4,
            Second: null,
            Third: null,
            FeedId: "4",
            Odds: 2.54,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "4. Mighty Snazy",
            DisplayDescription: "4. Mighty Snazy",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 5,
            Second: null,
            Third: null,
            FeedId: "5",
            Odds: 1.97,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "5. Regent Prince",
            DisplayDescription: "5. Regent Prince",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 6,
            Second: null,
            Third: null,
            FeedId: "6",
            Odds: 3.59,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "6. Crumpets And Tea",
            DisplayDescription: "6. Crumpets And Tea",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 7,
            Second: null,
            Third: null,
            FeedId: "7",
            Odds: 1.78,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "7. Max Million",
            DisplayDescription: "7. Max Million",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 8,
            Second: null,
            Third: null,
            FeedId: "8",
            Odds: 3.7,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "8. Sun Block",
            DisplayDescription: "8. Sun Block",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "Place",
        MarketClassID: 2,
        DisplayDescription: "Place",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 2,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 2,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Place",
        ID: "12-2-8261307-2",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
    ],
    PrimaryMarketsStore: [],
    Markets: [
      {
        FeedId: "Win",
        Name: "Win",
        Abbreviation: null,
        ClassValue: 1,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: 1,
            Second: null,
            Third: null,
            FeedId: "1",
            Odds: 18.04,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "1. Oscar",
            DisplayDescription: "1. Oscar",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 2,
            Second: null,
            Third: null,
            FeedId: "2",
            Odds: 11.91,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "2. Blitz",
            DisplayDescription: "2. Blitz",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 3,
            Second: null,
            Third: null,
            FeedId: "3",
            Odds: 2.47,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "3. Nitrox",
            DisplayDescription: "3. Nitrox",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 4,
            Second: null,
            Third: null,
            FeedId: "4",
            Odds: 10.21,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "4. Mighty Snazy",
            DisplayDescription: "4. Mighty Snazy",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 5,
            Second: null,
            Third: null,
            FeedId: "5",
            Odds: 5.56,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "5. Regent Prince",
            DisplayDescription: "5. Regent Prince",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 6,
            Second: null,
            Third: null,
            FeedId: "6",
            Odds: 23.52,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "6. Crumpets And Tea",
            DisplayDescription: "6. Crumpets And Tea",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 7,
            Second: null,
            Third: null,
            FeedId: "7",
            Odds: 4.31,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "7. Max Million",
            DisplayDescription: "7. Max Million",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 8,
            Second: null,
            Third: null,
            FeedId: "8",
            Odds: 25.23,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "8. Sun Block",
            DisplayDescription: "8. Sun Block",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: true,
        ClassEnumValue: "Win",
        MarketClassID: 1,
        DisplayDescription: "Win",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 1,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 1,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Win",
        ID: "12-2-8261307-1",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: "Place",
        Name: "Place",
        Abbreviation: null,
        ClassValue: 2,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: 1,
            Second: null,
            Third: null,
            FeedId: "1",
            Odds: 3.21,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "1. Oscar",
            DisplayDescription: "1. Oscar",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 2,
            Second: null,
            Third: null,
            FeedId: "2",
            Odds: 2.7,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "2. Blitz",
            DisplayDescription: "2. Blitz",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 3,
            Second: null,
            Third: null,
            FeedId: "3",
            Odds: 1.4,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "3. Nitrox",
            DisplayDescription: "3. Nitrox",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 4,
            Second: null,
            Third: null,
            FeedId: "4",
            Odds: 2.54,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "4. Mighty Snazy",
            DisplayDescription: "4. Mighty Snazy",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 5,
            Second: null,
            Third: null,
            FeedId: "5",
            Odds: 1.97,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "5. Regent Prince",
            DisplayDescription: "5. Regent Prince",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 6,
            Second: null,
            Third: null,
            FeedId: "6",
            Odds: 3.59,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "6. Crumpets And Tea",
            DisplayDescription: "6. Crumpets And Tea",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 7,
            Second: null,
            Third: null,
            FeedId: "7",
            Odds: 1.78,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "7. Max Million",
            DisplayDescription: "7. Max Million",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: 8,
            Second: null,
            Third: null,
            FeedId: "8",
            Odds: 3.7,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "8. Sun Block",
            DisplayDescription: "8. Sun Block",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "Place",
        MarketClassID: 2,
        DisplayDescription: "Place",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 2,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 2,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Place",
        ID: "12-2-8261307-2",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: "OE",
        Name: "Odd/Even",
        Abbreviation: null,
        ClassValue: 134,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: -1,
            Second: null,
            Third: null,
            FeedId: "O",
            Odds: 1.2,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "O",
            DisplayDescription: "Odd",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: -1,
            Second: null,
            Third: null,
            FeedId: "E",
            Odds: 4,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "E",
            DisplayDescription: "Even",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "RacingOddEven",
        MarketClassID: 134,
        DisplayDescription: "Odd/Even",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 5,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 134,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "RacingOddEven",
        ID: "12-2-8261307-134",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: "HL",
        Name: "High/Low",
        Abbreviation: null,
        ClassValue: 135,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [
          {
            First: -1,
            Second: null,
            Third: null,
            FeedId: "H",
            Odds: 2.12,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "H",
            DisplayDescription: "High",
            ExtraDescription: "",
            EntryID: null,
          },
          {
            First: -1,
            Second: null,
            Third: null,
            FeedId: "L",
            Odds: 1.63,
            IsWinner: false,
            Sort: 0,
            FeedDescription: "L",
            DisplayDescription: "Low",
            ExtraDescription: "",
            EntryID: null,
          },
        ],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "RacingHighLow",
        MarketClassID: 135,
        DisplayDescription: "High/Low",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 6,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 135,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "RacingHighLow",
        ID: "12-2-8261307-135",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: null,
        Name: null,
        Abbreviation: null,
        ClassValue: 3,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "Forecast",
        MarketClassID: 3,
        DisplayDescription: "1st Two In Order",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 1,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 3,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Forecast",
        ID: "12-2-8261307-3",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: null,
        Name: null,
        Abbreviation: null,
        ClassValue: 5,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "Tricast",
        MarketClassID: 5,
        DisplayDescription: "1st Three In Order",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 3,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 5,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Tricast",
        ID: "12-2-8261307-5",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: null,
        Name: null,
        Abbreviation: null,
        ClassValue: 4,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "ReverseForecast",
        MarketClassID: 4,
        DisplayDescription: "1st Two Any Order",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 2,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 4,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "ReverseForecast",
        ID: "12-2-8261307-4",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: null,
        Name: null,
        Abbreviation: null,
        ClassValue: 6,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "ReverseTricast",
        MarketClassID: 6,
        DisplayDescription: "1st Three Any Order",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 4,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 6,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "ReverseTricast",
        ID: "12-2-8261307-6",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
      {
        FeedId: null,
        Name: null,
        Abbreviation: null,
        ClassValue: 133,
        ArcherySelections: [],
        BoxingSelections: [],
        InstantBetSelections: [],
        PlayerVsPlayerSelections: [],
        FootballMatchSelections: [],
        KenoSelections: [],
        LuckyLoot624Selections: [],
        RaceSelections: [],
        RacingRouletteSelections: [],
        SpinAndWinSelections: [],
        IceHockeyMatchSelections: [],
        FinalHoopsMatchSelections: [],
        CricketMatchSelections: [],
        MarketClassSelections: [],
        FootballTournamentMatchSelections: [],
        LuckyRacingSelections: [],
        AnimalitosSelections: [],
        Split: null,
        IsClassAvailableForBetting: true,
        IsClassParticipants: false,
        ClassEnumValue: "Swinger",
        MarketClassID: 133,
        DisplayDescription: "Swinger",
        AmericanDisplayDescription: null,
        CssClass: null,
        BettingLayouts: [
          {
            EventTypeEnumValue: 2,
            MarketClassEventTypeID: 0,
            Position: 5,
            IsExpanded: false,
            BettingLayoutEnumValue: 1,
            MarketClassID: 133,
            ParentEventTypeEnumValue: null,
            LayoutPattern: null,
          },
        ],
        WinningSelectionID: null,
        WinningSelectionDescription: null,
        ResourceKey: "Swinger",
        ID: "12-2-8261307-133",
        HasErrorOccured: false,
        ErrorMessage: null,
      },
    ],
    Events: null,
    AdjustedStartTime: "/Date(1755618060148)/",
    AdjustedFinishTime: "/Date(1755618098148)/",
    BetCloseTime: "/Date(1755618060148)/",
    Number: 2096,
    StatusValue: 2,
    IsFinished: false,
    FeedGuid: "00000000-0000-0000-0000-000000000000",
    CacheExpiryDate: null,
    CacheExpiryDateAsWords: "",
    EstimatedFinishTime: "/Date(1755618118148)/",
    IsNow: false,
    IsNext: false,
    HasBeenProcessed: false,
    GameProviderGUID: "00000000-0000-0000-0000-000000000000",
    IceHockeyLeagueWeek: null,
    FinalHoopsLeagueWeek: null,
    FootballTournamentLeagueWeek: null,
    CricketMatch: null,
    LuckyRacing: null,
    Animalitos: null,
    ID: "12-2-8261307",
    HasErrorOccured: false,
    ErrorMessage: null,
  },
};

const handleComboButtonClicked = (type) => {
  const data = props.eventDetail.Event.Markets.filter((d) => {
    return d.ClassEnumValue === type;
  });

  // console.log(
  //   props.eventDetail.Event.EventId,
  //   props.eventDetail.Event.ID,
  //   "ReverseForecast",
  //   data[0].MarketClassID,
  //   props.eventDetail.Event.TypeValue
  // );
  // console.log(data);
  emit(
    "combo",
    "quinella",
    props.eventDetail.Event.EventId,
    props.eventDetail.Event.ID,
    type,
    data[0].MarketClassID,
    props.eventDetail.Event.TypeValue,
    data[0].DisplayDescription,
    props.eventDetail.Event.TypeName,
    props.eventDetail.Event.Number
  );
};
</script>

<template>
  <div class="flex">
    <table
      v-if="!finished"
      class="w-[73%] min-w-[540px] table-auto border-collapse DetailsTable"
    >
      <thead>
        <tr>
          <th colspan="3"></th>
          <th
            v-if="eventDetail.Event.TypeName !== 'PlatinumHounds'"
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[19px]"
          ></th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[80px]"
          >
            RATING
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[80px]"
          >
            LAST 5
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            WIN
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            PLACE
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            COMBO
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            BANK
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="d in eventDetail.Event.Race.Entries"
          class="text-center border-b"
        >
          <td
            v-if="
              eventDetail.Event.TypeName !== 'PlatinumHounds' &&
              eventDetail.Event.TypeName !== 'CycleRacing'
            "
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left text-[#37B34A] font-roboto"
          >
            {{ d.Draw }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left"
            style="width: 40px; min-width: 40px; max-width: 40px"
          >
            <img
              :src="`${
                eventDetail.Event.TypeName === 'PlatinumHounds' ||
                eventDetail.Event.TypeName === 'MotorRacing' ||
                eventDetail.Event.TypeName === 'CycleRacing' ||
                eventDetail.Event.TypeName === 'SingleSeaterMotorRacing'
                  ? imageDir[d.Draw - 1]
                  : eventDetail.Event.TypeName === 'SpeedSkating'
                  ? imageDir[Math.floor(Math.random() * 8) + 1]
                  : imageDir[d.SilkNumber - 1]
              }`"
              class="w-[32px] h-[32px] object-contain mx-auto"
              alt=""
            />
          </td>

          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] font-roboto text-left text-[#837272]"
          >
            {{ d.Name }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left font-roboto"
          >
            <div
              v-if="d.Favorite"
              class="w-[22px] h-[22px] rounded-full bg-[#ff6100] p-1 text-[.75em] flex justify-center items-center text-white border border-white"
            >
              {{ "F" + d.Favorite }}
            </div>

            <div
              v-if="!d.Favorite"
              class="w-[22px] h-[22px] rounded-full p-1 text-[.8em] flex justify-center items-center text-white border border-white"
            >
              {{ "F" + d.Favorite }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[80px]"
          >
            <Rating :rating="d.StarRating / 17" />
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[80px] text-[.8em] font-roboto tracking-widest opacity-70"
          >
            {{ d.Form }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              @click="
                if (!placingBet) {
                  $emit(
                    'winClicked',
                    eventDetail.Event.EventId,
                    'Win',
                    d.Description,
                    d.WinOdds,
                    eventDetail.Event.StartDateTimeAsWords,
                    eventDetail.Event.Number,
                    d.Draw,
                    eventDetail.Event.TypeName,
                    eventDetail.Event.ID
                  );
                  comboCalculator(eventDetail.Event.EventId);
                }
              "
              class="text-[1em] font-bold py-[1px] px-[7px] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out cursor-pointer"
              :class="
                trackingSelectedNumbers.some(
                  (bet) =>
                    bet.number === d.Draw &&
                    bet.id === eventDetail.Event.EventId &&
                    bet.betType === 'Win'
                )
                  ? 'bg-[#257832] text-[#eee]'
                  : 'bg-[#ffff80] text-[#111] hover:bg-[#37B34A]'
              "
            >
              {{ d.WinOdds }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              @click="
                if (!placingBet) {
                  $emit(
                    'winClicked',
                    eventDetail.Event.EventId,
                    'Place',
                    d.Description,
                    d.PlaceOdds,
                    eventDetail.Event.StartDateTimeAsWords,
                    eventDetail.Event.Number,
                    d.Draw,
                    eventDetail.Event.TypeName,
                    eventDetail.Event.ID
                  );
                  comboCalculator(eventDetail.Event.EventId);
                }
              "
              class="text-[#111] text-[1em] font-bold py-[1px] px-[7px] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out cursor-pointer"
              :class="
                trackingSelectedNumbers.some(
                  (bet) =>
                    bet.number === d.Draw &&
                    bet.id === eventDetail.Event.EventId &&
                    bet.betType === 'Place'
                )
                  ? 'bg-[#257832] text-[#eee]'
                  : 'bg-[#ffff80] text-[#111] hover:bg-[#37B34A]'
              "
            >
              {{ d.PlaceOdds }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] flex justify-center items-center font-roboto"
          >
            <div
              @click="
                $emit('comboSelected', d.Draw, eventDetail.Event.EventId);
                comboCalculator(eventDetail.Event.EventId);
              "
              class="text-[1em] w-[32px] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out flex justify-center items-center cursor-pointer gap-0.5"
              :class="
                checkIfNumberSelectedForCombo(d.Draw, eventDetail.Event.EventId)
                  .c
              "
            >
              {{
                checkIfNumberSelectedForCombo(d.Draw, eventDetail.Event.EventId)
                  .n
              }}
              <sup
                v-if="
                  checkIfNumberSelectedForCombo(
                    d.Draw,
                    eventDetail.Event.EventId
                  ).s
                "
                class="uppercase"
                >{{
                  checkIfNumberSelectedForCombo(
                    d.Draw,
                    eventDetail.Event.EventId
                  ).sup
                }}</sup
              >
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              class="text-[1em] w-[32px] h-[] text-[#8c8c8c] bg-[#fcfcfc] border border-[#37b34a] rounded-[3px] shadow-none text-center flex justify-center items-center opacity-30 mx-auto transition-all duration-200 ease-in-out hover:bg-[#37B34A] cursor-pointer font-medium"
            >
              {{ d.Draw }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <table
      v-else
      class="w-[73%] min-w-[540px] table-auto border-collapse DetailsTable"
    >
      <thead>
        <tr>
          <th colspan="3"></th>
          <th
            v-if="
              eventDetail.Event.TypeName !== 'PlatinumHounds' &&
              eventDetail.Event.TypeName !== 'CycleRacing'
            "
          ></th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[19px]"
          ></th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[80px]"
          >
            RATING
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[80px]"
          >
            LAST 5
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            WIN
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            PLACE
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            COMBO
          </th>
          <th
            scope="col"
            class="font-normal p-0 uppercase text-xs text-[#4c4c4c] m-0 h-[40px] w-[52px]"
          >
            BANK
          </th>
        </tr>
      </thead>
      <tbody
        :class="`${
          eventDetail.Event.Race.Result ? 'opacity-100' : 'opacity-50'
        }`"
      >
        <tr
          v-for="d in eventDetail.Event.Race.Entries"
          class="text-center border-b"
        >
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left text-[#837272] font-roboto"
          >
            {{ d.Finish }}
          </td>
          <td
            v-if="
              eventDetail.Event.TypeName !== 'PlatinumHounds' &&
              eventDetail.Event.TypeName !== 'CycleRacing'
            "
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left text-[#37B34A] font-roboto"
          >
            {{ d.Draw }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left"
            style="width: 40px; min-width: 40px; max-width: 40px"
          >
            <img
              :src="`${
                eventDetail.Event.TypeName === 'PlatinumHounds' ||
                eventDetail.Event.TypeName === 'MotorRacing' ||
                eventDetail.Event.TypeName === 'CycleRacing' ||
                eventDetail.Event.TypeName === 'SingleSeaterMotorRacing'
                  ? imageDir[d.Draw - 1]
                  : eventDetail.Event.TypeName === 'SpeedSkating'
                  ? imageDir[Math.floor(Math.random() * 8) + 1]
                  : imageDir[d.SilkNumber - 1]
              }`"
              class="w-[32px] h-[32px] object-contain mx-auto"
              alt=""
            />
          </td>

          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left text-[#837272] font-roboto"
          >
            {{ d.Name }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] text-left"
          >
            <div
              v-if="d.Favorite"
              class="w-[22px] h-[22px] rounded-full bg-[#ff6100] p-1 text-[.75em] flex justify-center items-center text-white border border-white font-roboto"
            >
              {{ "F" + d.Favorite }}
            </div>

            <div
              v-if="!d.Favorite"
              class="w-[22px] h-[22px] rounded-full p-1 text-[.8em] flex justify-center items-center text-white border border-white font-roboto"
            >
              {{ "F" + d.Favorite }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[80px]"
          >
            <Rating :rating="d.StarRating / 17" />
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[80px] text-[.8em] font-normal tracking-widest opacity-70 font-roboto"
          >
            {{ d.Form }}
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              class="text-[1em] font-bold py-[1px] px-[7px] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out cursor-not-allowed relative"
              :class="`${
                d.Finish === 1
                  ? 'text-[#F8FCF6] bg-[#727272]'
                  : 'text-[#111] bg-[#ffff80] opacity-50 '
              } `"
            >
              <span class="absolute top-[-12px] right-[-5px]">
                <LockIcon />
              </span>
              {{ d.WinOdds }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              class="text-[1em] font-bold py-[1px] px-[7px] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out cursor-not-allowed relative"
              :class="`${
                eventDetail.Event.Race.PlacePaysOn === 3
                  ? d.Finish === 1 || d.Finish === 2 || d.Finish === 3
                    ? 'text-[#F8FCF6] bg-[#727272]'
                    : 'text-[#111] bg-[#ffff80] opacity-50 '
                  : d.Finish === 1 || d.Finish === 2
                  ? 'text-[#F8FCF6] bg-[#727272]'
                  : 'text-[#111] bg-[#ffff80] opacity-50 '
              } `"
            >
              <span class="absolute top-[-12px] right-[-5px]">
                <LockIcon />
              </span>
              {{ d.PlaceOdds }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] flex justify-center items-center font-roboto"
          >
            <div
              class="text-[1em] w-[32px] text-[#111] bg-[#ffff80] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out flex justify-center items-center font-medium opacity-50 cursor-not-allowed relative"
            >
              <span class="absolute top-[-12px] right-[-5px]">
                <LockIcon />
              </span>
              {{ d.Draw }}
            </div>
          </td>
          <td
            class="m-0 px-[3px] py-0 align-middle whitespace-nowrap h-[39px] w-[52px] font-roboto"
          >
            <div
              class="text-[1em] w-[32px] text-[#111] bg-[#ffff80] border border-[#37b34a] rounded-[3px] shadow-none text-center ml-[5px] transition-all duration-200 ease-in-out flex justify-center items-center font-medium opacity-50 cursor-default relative"
            >
              <span class="absolute top-[-12px] right-[-5px]">
                <LockIcon />
              </span>
              {{ d.Draw }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="
        !finished && comboSelections[eventDetail.Event.EventId]?.length === 1
      "
      class="flex flex-col justify-start items-start w-[25%] mt-8 ml-2"
    >
      <div class="text-[15px]">
        Need a minimum of two selections to create a combo
      </div>
      <div
        class="text-white bg-[#fb827f] border-0 text-base font-normal uppercase cursor-pointer px-3 py-1.5 m-0 rounded-none hover:border-transparent hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_0_0_black] transition-all duration-400 flex items-center"
        @click="$emit('clearComboBets', eventDetail.Event.EventId)"
      >
        Clear
        <!-- Outline Trashcan (24x24) -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-trash-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"
          />
        </svg>
      </div>
    </div>

    <div
      v-if="!finished && comboSelections[eventDetail.Event.EventId]?.length > 1"
      class="flex flex-col items-start justify-start w-[25%] mt-8 ml-2 font-roboto tracking-wide"
    >
      <div class="flex flex-col lg:flex-row gap-2">
        <div v-if="comboSelections[eventDetail.Event.EventId]?.length > 1">
          <ComboBox
            name="Quinella"
            selections="2 any order"
            :combo="quinela"
            @click="
              quinela === 1 ? handleComboButtonClicked('ReverseForecast') : ''
            "
          />
          <ComboBox
            name="Exacta"
            selections="2 in order"
            :combo="exact"
            @click="exact === 1 ? handleComboButtonClicked('Forecast') : ''"
          />
          <ComboBox
            name="Swinger"
            selections="2 in 3 any order"
            :combo="swinger"
            @click="swinger === 1 ? handleComboButtonClicked('Swinger') : ''"
          />
        </div>
        <div v-if="comboSelections[eventDetail.Event.EventId]?.length > 2">
          <ComboBox
            name="Trio"
            selections="3 any order"
            :combo="trio"
            @click="
              trio === 1 ? handleComboButtonClicked('ReverseTricast') : ''
            "
          />
          <ComboBox
            name="Trifecta"
            selections="2 in order"
            :combo="trifecta"
            @click="trifecta === 1 ? handleComboButtonClicked('Tricast') : ''"
          />
        </div>
      </div>

      <div
        @click="$emit('clearComboBets', eventDetail.Event.EventId)"
        class="text-white bg-[#fb827f] border-0 text-base font-normal uppercase cursor-pointer px-3 py-1.5 m-0 rounded-none hover:border-transparent hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_0_0_black] transition-all duration-400 flex items-center"
      >
        Clear

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-trash-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
