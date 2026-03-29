<script setup>
import KendoDate from "./KendoDate.vue";

defineProps({
  time: {
    type: String,
    default: "00:00:00",
  },
});

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
</script>

<template>
  <div class="relative w-full max-w-xs">
    <div
      class="w-full rounded-md border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 tracking-wide"
    >
      {{ `${getCurrentDateTime().date} ${time}` }}
    </div>

    <div
      class="absolute inset-y-0 right-0 flex items-center space-x-2 text-[#37b34a] bg-slate-200 rounded-r-md px-1 cursor-pointer hover:bg-[#d8d8d8]"
    >
      <svg viewBox="0 0 512 512" class="w-4 h-4 fill-current">
        <path
          d="M416 416H288V288h128zm64-352v384c0 17.6-14.4 32-32 32H64c-17.6 0-32-14.4-32-32V64c0-17.6 14.4-32 32-32h64V0h64v32h128V0h64v32h64c17.6 0 32 14.4 32 32m-32 128H64v255.9l.1.1 383.9-.1zm0-127.9q-.15-.15 0 0l-64-.1v32h-64V64H192v32h-64V64H64.1l-.1.1V160h384z"
        ></path>
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  </div>
</template>
