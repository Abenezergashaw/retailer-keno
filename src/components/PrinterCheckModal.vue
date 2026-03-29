<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";

const props = defineProps({
  showPrinterCheckModal: { type: Boolean, default: false },
  title: { type: String, default: "Modal Title" },
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
    v-if="showPrinterCheckModal"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20"
  >
    <div
      ref="modalRef"
      class="absolute bg-white shadow-lg rounded min-w-[250px] min-h-[150px]"
      style="
        animation: scaleIn 0.5s ease-out forwards;
        width: 50%;
        max-width: 700px;
        /* height: 170px; */
      "
    >
      <!-- Header (draggable area) -->
      <div
        class="bg-[#37b34a] text-white px-1 py-3 rounded-t-md flex justify-end items-center"
        @mousedown="startDrag"
      >
        <button
          @click="$emit('close')"
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
      <div
        class="py-2 px-4 h-[calc(100%-40px)] overflow-auto relative text-center text-sm font-roboto"
      >
        We cannot connect to the retail manager. The retail manager needs to be
        running for the retail system to work. Please reload after you have
        started the retail manager. You can download the retail manager from
        <a
          class="text-[#37b34a] cursor-pointer hover:underline hover:text-[#577B9B]"
          href="/BetMan.Retail.Manager.application"
          download
          >here</a
        >
        <div
          class="bg-[#f0f0f0] font-roboto py-2.5 mt-2 w-[60px] rounded-[7px] mx-auto cursor-pointer"
        >
          Ok
        </div>
      </div>
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
