<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";
import EyeIcon from "./EyeIcon.vue";
import PrintIcon from "./PrintIcon.vue";
import OptionButtons from "./OptionButtons.vue";
import CloseIcon from "./CloseIcon.vue";

const props = defineProps({
  showRedeem: { type: Boolean, default: false },
  title: { type: String, default: "Modal Title" },
  redeemTicket: {
    type: Object,
    default: { rows: [], numbers: [], PlacePaysOn: null },
  },
  redeemTicketLoader: Boolean,
  redeemTicketMessage: String,
  ticketRedeemedSuccess: Boolean,
  cannotReddemTicket: Boolean,
});

const emit = defineEmits(["close"]);

const isDragging = ref(false);
const isResizing = ref(false);
const resizeDir = ref(null);
const offsetX = ref(0);
const offsetY = ref(0);
const modalRef = ref(null);
const inputRef = ref(null);

const ticketId = ref("");

// console.log(props.redeemTicket, "-----");

let winners = [];

const totalWin = computed(() => {
  return props.redeemTicket.rows.reduce((acc, bet) => {
    if (bet.betType === "keno") {
      const ticketNumbers = bet.name.split(",").map((n) => n.trim());
      const kenoPayout = kenoWinChecker(
        ticketNumbers,
        props.redeemTicket.isResult.split(",").map((n) => n.trim()),
      );
      if (kenoPayout > 0) {
        return acc + bet.stake * kenoPayout;
      }
      return acc;
    } else if (bet.betType === "Win") {
      if (props.redeemTicket.numbers[0] === String(bet.number)) {
        return acc + bet.stake * bet.odd;
      }
    } else if (bet.betType === "Place") {
      console.log(props.redeemTicket.PlacePaysOn, "sadasdas");

      if (props.redeemTicket.PlacePaysOn == 3) {
        if (
          props.redeemTicket.numbers[0] === String(bet.number) ||
          props.redeemTicket.numbers[1] === String(bet.number) ||
          props.redeemTicket.numbers[2] === String(bet.number)
        ) {
          return acc + bet.stake * bet.odd;
        }
      } else if (props.redeemTicket.PlacePaysOn == 2) {
        if (
          props.redeemTicket.numbers[0] === String(bet.number) ||
          props.redeemTicket.numbers[1] === String(bet.number)
        ) {
          return acc + bet.stake * bet.odd;
        }
      }
    } else if (bet.betType === "1st Two Any Order") {
      const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
      const formatted2 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

      if (formatted1 === bet.name || formatted2 === bet.name) {
        return acc + bet.stake * bet.odd;
      }
    } else if (bet.betType === "Swinger") {
      const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
      const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;
      const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;
      const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
      const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;
      const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;

      if (
        formatted1 === bet.name ||
        formatted2 === bet.name ||
        formatted3 === bet.name ||
        formatted4 === bet.name ||
        formatted5 === bet.name ||
        formatted6 === bet.name
      ) {
        return acc + bet.stake * bet.odd;
      }
    } else if (bet.betType === "1st Two In Order") {
      const formatted = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}]`;

      if (formatted === bet.name) {
        return acc + bet.stake * bet.odd;
      }
    } else if (bet.betType === "1st Three In Order") {
      const formatted = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}/${props.redeemTicket.numbers[2]}]`;

      if (formatted === bet.name) {
        return acc + bet.stake * bet.odd;
      }
    } else if (bet.betType === "1st Three Any Order") {
      const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
      const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;
      const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;
      const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;
      const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
      const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

      if (
        formatted1 === bet.name ||
        formatted2 === bet.name ||
        formatted3 === bet.name ||
        formatted4 === bet.name ||
        formatted5 === bet.name ||
        formatted6 === bet.name
      ) {
        return acc + bet.stake * bet.odd;
      }
    }

    return acc;
  }, 0);
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

const keyboard = [1, 2, 3, 4, 5, 6, 7, 8, 9, "L", 0, ""];

watch(
  () => props.showRedeem,
  async (val) => {
    if (val) {
      await nextTick();
      setTimeout(() => {
        inputRef.value?.focus();
      }, 400);
    }
  },
);

function startDrag(e) {
  if (isResizing.value) return;
  isDragging.value = true;
  const rect = modalRef.value.getBoundingClientRect();
  offsetX.value = e.clientX - rect.left;
  offsetY.value = e.clientY - rect.top;
}

function onDrag(e) {
  if (isDragging.value) {
    modalRef.value.style.left = `${e.clientX - offsetX.value}px`;
    modalRef.value.style.top = `${e.clientY - offsetY.value}px`;
  } else if (isResizing.value) {
    const rect = modalRef.value.getBoundingClientRect();
    if (resizeDir.value.includes("right")) {
      modalRef.value.style.width = `${e.clientX - rect.left}px`;
    }
    if (resizeDir.value.includes("bottom")) {
      modalRef.value.style.height = `${e.clientY - rect.top}px`;
    }
    if (resizeDir.value.includes("left")) {
      const diff = e.clientX - rect.left;
      modalRef.value.style.width = `${rect.width - diff}px`;
      modalRef.value.style.left = `${rect.left + diff}px`;
    }
    if (resizeDir.value.includes("top")) {
      const diff = e.clientY - rect.top;
      modalRef.value.style.height = `${rect.height - diff}px`;
      modalRef.value.style.top = `${rect.top + diff}px`;
    }
  }
}

function stopActions() {
  isDragging.value = false;
  isResizing.value = false;
  resizeDir.value = null;
}

function startResize(e, dir) {
  isResizing.value = true;
  resizeDir.value = dir;
  e.stopPropagation();
}

function getCurrentDateTime() {
  const now = new Date();

  const pad = (num) => String(num).padStart(2, "0");

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // months are 0-based
  const year = now.getFullYear();

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`,
  };
}

function appendDigit(digit) {
  if (!digit) {
    ticketId.value = ticketId.value.slice(0, -1);
    return;
  }
  const d = String(digit);
  ticketId.value += String(d);
}

function winCheckHelper(t) {
  if (t.betType === "keno") {
    const ticketNumbers = t.name.split(",").map((n) => n.trim());
    const winNumbers = props.redeemTicket.isResult
      .split(",")
      .map((n) => n.trim());

    const wonOdd = kenoWinChecker(ticketNumbers, winNumbers);
    console.log(wonOdd, "=====");
    if (wonOdd > 0) {
      winners.push(t.singleId);
    }

    return t.stake * wonOdd;
  } else if (t.betType === "Win") {
    if (String(t.number) === props.redeemTicket.numbers[0]) {
      winners.push(t.singleId);
    }
    return String(t.number) === props.redeemTicket.numbers[0]
      ? (t.stake * t.odd).toFixed(2)
      : 0;
  } else if (t.betType === "Place") {
    if (props.redeemTicket.PlacePaysOn === 3) {
      if (
        String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1] ||
        String(t.number) === props.redeemTicket.numbers[2]
      ) {
        winners.push(t.singleId);
      }
      return String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1] ||
        String(t.number) === props.redeemTicket.numbers[2]
        ? (t.stake * t.odd).toFixed(2)
        : 0;
    } else {
      if (
        String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1]
      ) {
        winners.push(t.singleId);
      }
      return String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1]
        ? (t.stake * t.odd).toFixed(2)
        : 0;
    }
  } else if (t.betType === "1st Two Any Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

    if (formatted1 === t.name || formatted2 === t.name) {
      winners.push(t.singleId);
      return (t.stake * t.odd).toFixed(2);
    }
    return 0;
  } else if (t.betType === "Swinger") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;
    const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;
    const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
    const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;
    const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;

    if (
      formatted1 === t.name ||
      formatted2 === t.name ||
      formatted3 === t.name ||
      formatted4 === t.name ||
      formatted5 === t.name ||
      formatted6 === t.name
    ) {
      winners.push(t.singleId);
      return (t.stake * t.odd).toFixed(2);
    }
    return 0;
  } else if (t.betType === "1st Two In Order") {
    const formatted = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}]`;

    if (formatted === t.name) {
      winners.push(t.singleId);
      return (t.stake * t.odd).toFixed(2);
    }
    return 0;
  } else if (t.betType === "1st Three In Order") {
    const formatted = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}/${props.redeemTicket.numbers[2]}]`;

    if (formatted === t.name) {
      winners.push(t.singleId);
      return (t.stake * t.odd).toFixed(2);
    }
    return 0;
  } else if (t.betType === "1st Three Any Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;
    const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;
    const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;
    const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

    if (
      formatted1 === t.name ||
      formatted2 === t.name ||
      formatted3 === t.name ||
      formatted4 === t.name ||
      formatted5 === t.name ||
      formatted6 === t.name
    ) {
      winners.push(t.singleId);
      return (t.stake * t.odd).toFixed(2);
    }
    return 0;
  }
}

function bgHelper(t) {
  if (t.betType === "keno") {
    const ticketNumbers = t.name.split(",").map((n) => n.trim());
    const winNumbers = props.redeemTicket.isResult
      .split(",")
      .map((n) => n.trim());

    const wonOdd = kenoWinChecker(ticketNumbers, winNumbers);
    // console.log(wonOdd, "=====");
    return wonOdd > 0 ? 1 : 0;
  } else if (t.betType === "Win") {
    return String(t.number) === props.redeemTicket.numbers[0] ? 1 : 0;
  } else if (t.betType === "Place") {
    if (props.redeemTicket.PlacePaysOn === 3) {
      return String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1] ||
        String(t.number) === props.redeemTicket.numbers[2]
        ? 1
        : 0;
    } else {
      return String(t.number) === props.redeemTicket.numbers[0] ||
        String(t.number) === props.redeemTicket.numbers[1]
        ? 1
        : 0;
    }
  } else if (t.betType === "1st Two Any Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

    if (formatted2 === t.name || formatted1 === t.name) {
      return 1;
    }
    return 0;
  } else if (t.betType === "Swinger") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;
    const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;
    const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
    const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;
    const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;

    if (
      formatted1 === t.name ||
      formatted2 === t.name ||
      formatted3 === t.name ||
      formatted4 === t.name ||
      formatted5 === t.name ||
      formatted6 === bet.name
    ) {
      return 1;
    }
    return 0;
  } else if (t.betType === "1st Two In Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}]`;

    if (formatted1 === t.name) {
      return 1;
    }
    return 0;
  } else if (t.betType === "1st Three In Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}/${props.redeemTicket.numbers[1]}/${props.redeemTicket.numbers[2]}]`;

    if (formatted1 === t.name) {
      return 1;
    }
    return 0;
  } else if (t.betType === "1st Three Any Order") {
    const formatted1 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}]`;
    const formatted2 = `[${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}]`;
    const formatted3 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[2]}]`;

    const formatted4 = `[${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}]`;

    const formatted5 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[0]}-${props.redeemTicket.numbers[1]}]`;
    const formatted6 = `[${props.redeemTicket.numbers[2]}-${props.redeemTicket.numbers[1]}-${props.redeemTicket.numbers[0]}]`;

    if (
      formatted1 === t.name ||
      formatted2 === t.name ||
      formatted3 === t.name ||
      formatted4 === t.name ||
      formatted5 === t.name ||
      formatted6 === t.name
    ) {
      return 1;
    }
    return 0;
  }
}

function nameHelper(name) {
  let gameName = null;

  if (name === "SmartPlayKeno") gameName = "Keno";
  else if (name === "PlatinumHounds") gameName = "Greyhound Racing";
  else if (name === "DashingDerby") gameName = "Horse Racing";
  else if (name === "SpeedSkating") gameName = "Speed Skating";
  else if (name === "SteepleChase") gameName = "Steeple Chase Racing";
  else if (name === "MotorRacing") gameName = "Motor Racing";
  else if (name === "CycleRacing") gameName = "Track Racing";
  else if (name === "HarnessRacing") gameName = "Harness Racing";
  else if (name === "SingleSeaterMotorRacing") gameName = "SS Motor Racing";

  return gameName;
}

onMounted(() => {
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopActions);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopActions);
});
</script>

<template>
  <div
    v-if="showRedeem"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div
      ref="modalRef"
      class="absolute bg-white shadow-lg rounded min-w-[250px] min-h-[150px] overflow-auto"
      style="
        animation: scaleIn 0.5s ease-out forwards;
        width: 98vw;
        max-height: 98vh;
      "
    >
      <!-- Header (draggable area) -->
      <div
        class="bg-[#37b34a] text-white px-3 py-2 rounded-t-lg flex justify-between items-center"
        @mousedown="startDrag"
      >
        <span class="font-roboto">{{ title }}</span>
        <button
          @click="
            $emit('close');
            ticketId = '';
          "
          class="fill-[#bfbfbf] text-[#1f652a] hover:fill-[#57BF67] hover:text-[#818382]"
        >
          <CloseIcon />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 h-[calc(100%-40px)] overflow-auto relative">
        <div
          v-if="redeemTicketLoader"
          class="w-full h-full absolute flex items-center justify-center bg-opacity-20"
        >
          <img src="../assets/images/loading-image.gif" alt="Loading..." />
        </div>

        <div
          v-if="ticketRedeemedSuccess"
          class="bg-gradient-to-b from-[#68C576] to-[#38B34B] text-white w-full h-9 rounded font-roboto text-sm flex justify-between items-center gap-1 px-2"
          style="animation: scaleIn 0.3s ease-out forwards"
        >
          <div class="flex gap-1 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-green-500"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>

            Ticket redeemed successfully.
          </div>
          <button
            @click="ticketRedeemedSuccess = false"
            class="fill-[#bfbfbf] text-[#1f652a] hover:fill-[#57BF67] hover:text-[#818382]"
          >
            <!-- Example with an inline SVG -->
            <svg
              class="w-[12px] h-[12px]"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="2"
                y1="2"
                x2="14"
                y2="14"
                stroke="white"
                stroke-width="3"
              />
              <line
                x1="14"
                y1="2"
                x2="2"
                y2="14"
                stroke="white"
                stroke-width="3"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="cannotReddemTicket"
          class="bg-gradient-to-b from-[#DB4341] to-[#DB4240] text-white w-full h-9 rounded font-roboto text-sm flex justify-between items-center gap-1 px-2"
          style="animation: scaleIn 0.3s ease-out forwards"
        >
          <div class="flex gap-1 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>

            Cannot reddem ticket.
          </div>
          <button
            @click="ticketCancelledSuccess = false"
            class="fill-[#bfbfbf] text-[#1f652a] hover:fill-[#57BF67] hover:text-[#818382]"
          >
            <!-- Example with an inline SVG -->
            <svg
              class="w-[12px] h-[12px]"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="2"
                y1="2"
                x2="14"
                y2="14"
                stroke="white"
                stroke-width="3"
              />
              <line
                x1="14"
                y1="2"
                x2="2"
                y2="14"
                stroke="white"
                stroke-width="3"
              />
            </svg>
          </button>
        </div>

        <div class="w-full h-full flex justify-start items-start gap-2">
          <div class="w-1/3 h-full flex flex-col gap-2 py-2">
            <div class="text-[#37b34a] font-roboto text-xl">
              Enter betslip code or scan
            </div>
            <div class="font-roboto text-sm w-full">
              <input
                type="text"
                v-model="ticketId"
                ref="inputRef"
                class="w-[70%] py-1 px-2 border border-gray-400 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield outline-none focus:shadow-[0_0_8px_#60a5fa] transition-shadow duration-200"
              />
            </div>
            <div class="grid grid-cols-3 w-[90%] gap-y-4 gap-x-2 mt-4 text-sm">
              <div
                v-for="k in keyboard"
                :key="k"
                @click="appendDigit(k)"
                class="font-roboto bg-[#37b34a] border border-[#37b34a] py-2 rounded flex justify-center items-center text-white cursor-pointer hover:bg-white hover:text-[#37b34a]"
              >
                {{ k }}
                <svg
                  v-if="k === ''"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-white"
                >
                  <line x1="9" y1="12" x2="21" y2="12" />
                  <polygon points="9,6 3,12 9,18" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div class="w-[90%] flex justify-between mt-4 text-sm">
              <div
                @click="ticketId = ''"
                class="font-roboto bg-[#F0F0F0] border py-2 rounded flex justify-center items-center cursor-pointer px-4"
              >
                Clear
              </div>
              <div
                @click="$emit('redeemTicket', ticketId)"
                class="font-roboto bg-[#37b34a] border border-[#37b34a] py-2 rounded flex justify-center items-center text-white cursor-pointer hover:bg-[#2B8C3A] px-4"
              >
                Enter
              </div>
            </div>
          </div>
          <div class="w-2/3 flex flex-col gap-2 py-2 border-l px-2 font-roboto">
            <div
              v-if="
                redeemTicket?.rows?.length === 0 && redeemTicketMessage !== null
              "
              class="text-sm"
            >
              {{ redeemTicketMessage }}
            </div>

            <div
              v-if="redeemTicket?.rows?.length > 0"
              class="flex flex-col gap-2"
            >
              <div class="text-[#37b34a] font-roboto text-xl">Betslip</div>
              <table class="w-[98%] text-sm border-collapse">
                <thead>
                  <tr class="border-b-[1.4px] border-gray-300">
                    <th class="text-left px-2 py-1">ID</th>
                    <th class="text-left px-2 py-1">Date</th>
                    <th class="text-left px-2 py-1">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-left px-2 py-1">{{ ticketId }}</td>
                    <td class="text-left px-2 py-1">
                      {{ getCurrentDateTime().date }}
                    </td>
                    <td class="text-left px-2 py-1">
                      {{ getCurrentDateTime().time }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="text-[#37b34a] font-roboto text-xl">Bets</div>
              <table class="w-[98%] text-sm border-collapse font-roboto">
                <thead>
                  <tr class="border-y-[1.1px] border-gray-200 bg-gray-50 py-2">
                    <th class="text-left mr-1 py-2 w-[100px]"></th>
                    <th class="text-left mr-1 px-2 py-2">BetID</th>
                    <th class="text-left mr-1 px-2 py-2">Game</th>
                    <th class="text-left mr-1 px-2 py-2">Event No</th>
                    <th class="text-left mr-1 px-2 py-2">Market</th>
                    <th class="text-left mr-1 px-2 py-2">Selection</th>
                    <th class="text-left mr-1 px-2 py-2">Win</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in redeemTicket.rows"
                    class="border-b border-gray-300"
                    :class="`${bgHelper(t) ? 'bg-[#CDB461] text-[#fff]' : ''}`"
                  >
                    <td
                      class="text-left py-2.5 w-[100px] h-full flex justify-center items-center gap-2 pl-1"
                    >
                      <EyeIcon />
                      <PrintIcon />
                    </td>
                    <td class="text-left px-2 py-2.5">
                      {{ t.singleId }}
                    </td>
                    <td class="text-left px-2 py-2.5 tracking-widest">
                      {{ nameHelper(t.game) }}
                    </td>
                    <td class="text-left px-2 py-2.5">{{ t.gameId }}</td>
                    <td class="text-left px-2 py-2.5">
                      {{ t.betType === "keno" ? "Win" : t.betType }}
                    </td>
                    <td class="text-left px-2 py-2.5">{{ t.name }}</td>
                    <td class="text-left px-2 py-2.5">
                      Br.
                      {{ winCheckHelper(t) }}
                    </td>
                  </tr>
                  <tr class="">
                    <td class="text-left px-2 py-2.5 w-[130px]">
                      {{ getCurrentDateTime().date }}
                      {{ getCurrentDateTime().time }}
                    </td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5">Br. 0.00</td>
                  </tr>
                </tbody>
              </table>

              <div
                v-if="!ticketRedeemedSuccess"
                class="flex justify-end items-center gap-2 mt-2 w-[98%] font-semibold"
              >
                {{
                  totalWin > 0
                    ? `Unclaimed Winnings Br ${totalWin.toFixed(2)}`
                    : "Not a Winning Ticket"
                }}
                <button
                  @click="
                    handleProceedRedeem();
                    winners = [];
                  "
                  class="h-[34px] px-3 font-roboto flex justify-center items-center gap-2 cursor-pointer text-[.88em] rounded transition-colors text-white bg-[#37b34a] hover:bg-[#2B8C3A]"
                >
                  Redeem
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-currency-dollar font-bold"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize handles -->
      <div
        class="absolute top-0 left-0 w-2 h-full cursor-w-resize"
        @mousedown="startResize($event, 'left')"
      ></div>
      <div
        class="absolute top-0 right-0 w-2 h-full cursor-e-resize"
        @mousedown="startResize($event, 'right')"
      ></div>
      <div
        class="absolute top-0 left-0 w-full h-2 cursor-n-resize"
        @mousedown="startResize($event, 'top')"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-full h-2 cursor-s-resize"
        @mousedown="startResize($event, 'bottom')"
      ></div>

      <!-- Corners -->
      <div
        class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        @mousedown="startResize($event, 'top left')"
      ></div>
      <div
        class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        @mousedown="startResize($event, 'top right')"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        @mousedown="startResize($event, 'bottom left')"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        @mousedown="startResize($event, 'bottom right')"
      ></div>
    </div>
  </div>
</template>

<style>
@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    /* transform: scale(0.8); */
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
