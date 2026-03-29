<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: "Modal Title" },
  cancelTicket: {
    type: Array,
    default: [],
  },
  cancelTicketLoader: Boolean,
  cancleTicketMessage: String,
  ticketCancelledSuccess: Boolean,
  cannotCancelTicket: Boolean,
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

const totalStake = computed(() => {
  return props.cancelTicket.reduce((acc, bet) => acc + bet.stake, 0);
});

const keyboard = [1, 2, 3, 4, 5, 6, 7, 8, 9, "L", 0, ""];

watch(
  () => props.show,
  async (val) => {
    if (val) {
      await nextTick();
      setTimeout(() => {
        inputRef.value?.focus();
      }, 400);
    }
  }
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
    v-if="show"
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
            ticketId = null;
          "
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
              stroke="currentColor"
              stroke-width="3"
            />
            <line
              x1="14"
              y1="2"
              x2="2"
              y2="14"
              stroke="currentColor"
              stroke-width="3"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 h-[calc(100%-40px)] overflow-auto relative">
        <div
          v-if="cancelTicketLoader"
          class="w-full h-full absolute flex items-center justify-center bg-opacity-20"
        >
          <img src="../assets/images/loading-image.gif" alt="Loading..." />
        </div>

        <div
          v-if="ticketCancelledSuccess"
          class="bg-gradient-to-b from-[#68C576] to-[#38B34B] text-white w-full h-9 rounded font-roboto text-sm flex justify-between items-center gap-1 px-2"
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

            Cancellation completed successfully.
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

        <div
          v-if="cannotCancelTicket"
          class="bg-gradient-to-b from-[#DB4341] to-[#DB4240] text-white w-full h-9 rounded font-roboto text-sm flex justify-between items-center gap-1 px-2"
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

            Too late to cancel, events started
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
                @click="$emit('cancelTicket', ticketId)"
                class="font-roboto bg-[#37b34a] border border-[#37b34a] py-2 rounded flex justify-center items-center text-white cursor-pointer hover:bg-[#2B8C3A] px-4"
              >
                Enter
              </div>
            </div>
          </div>
          <div class="w-2/3 flex flex-col gap-2 py-2 border-l px-2 font-roboto">
            <div
              v-if="cancelTicket.length === 0 && cancleTicketMessage !== null"
              class="text-sm"
            >
              {{ cancleTicketMessage }}
            </div>

            <div v-if="cancelTicket.length > 0" class="flex flex-col gap-2">
              <div class="text-[#37b34a] font-roboto text-xl">Betslip</div>
              <table class="w-[98%] text-sm border-collapse">
                <thead>
                  <tr class="border-b-[1.4px] border-gray-400">
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
                  <tr class="border-y-[1.1px] border-gray-400 bg-gray-50 py-2">
                    <th class="text-left px-2 py-2">BetID</th>
                    <th class="text-left px-2 py-2">Game</th>
                    <th class="text-left px-2 py-2">Event No</th>
                    <th class="text-left px-2 py-2">Market</th>
                    <th class="text-left px-2 py-2">Selection</th>
                    <th class="text-left px-2 py-2">Win</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in cancelTicket"
                    class="border-b border-gray-300"
                  >
                    <td class="text-left px-2 py-2.5">
                      {{ Math.floor(Math.random() * 999999) + 99999 }}
                    </td>
                    <td class="text-left px-2 py-2.5">{{ t.game }}</td>
                    <td class="text-left px-2 py-2.5">{{ t.gameId }}</td>
                    <td class="text-left px-2 py-2.5">{{ t.betType }}</td>
                    <td class="text-left px-2 py-2.5">{{ t.name }}</td>
                    <td class="text-left px-2 py-2.5">Br. {{ 0 }}</td>
                  </tr>
                  <tr class="bg-gray-50 border-b">
                    <td class="text-left px-2 py-2.5">
                      {{ getCurrentDateTime().date }}
                      {{ getCurrentDateTime().time }}
                    </td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5"></td>
                    <td class="text-left px-2 py-2.5">Br. 0</td>
                  </tr>
                </tbody>
              </table>

              <div
                v-if="!ticketCancelledSuccess"
                class="flex justify-end items-center gap-2 mt-2 w-[98%] font-semibold"
              >
                Total Stake Br {{ totalStake.toFixed(2) }}
                <button
                  @click="
                    $emit('proceedCancelTicket', ticketId);
                    ticketId = '';
                  "
                  class="h-[34px] px-3 font-roboto flex justify-center items-center gap-2 cursor-pointer text-[.88em] rounded transition-colors text-white bg-[#f0ad4e] hover:bg-[#ec971f]"
                >
                  Cancel
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    role="img"
                    aria-label="ban circle icon"
                  >
                    <circle cx="8" cy="8" r="6.6"></circle>
                    <line x1="3.2" y1="12.8" x2="12.8" y2="3.2"></line>
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
