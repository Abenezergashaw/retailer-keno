<script setup>
import { ref } from "vue";

const proceedCancelTicket = defineProps({
  temporaryKenoBalls: Array,
});

// Create array [1..80]
const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

// Track selected boxes
const selected = ref([]);

function toggle(n) {
  if (selected.value.includes(n)) {
    selected.value = selected.value.filter((x) => x !== n);
  } else {
    selected.value.push(n);
  }
}
</script>

<template>
  <div class="p-2 w-[76%] flex justify-center items-center">
    <div class="grid grid-cols-10 w-full gap-0.5 p-2 rounded-xl font-roboto">
      <!-- First 40 numbers -->
      <div
        v-for="n in numbers.slice(0, 40)"
        @click="$emit('kenoballsclicked', n)"
        :key="n"
        class="w-10 h-10 flex items-center justify-center text-lg cursor-pointer select-none rounded-full text-white hover:bg-[#97CA97] hover:scale-110 hover:shadow-[0_0_16px_2px_rgba(0,0,0,0.2)]"
        :class="
          temporaryKenoBalls.includes(n)
            ? 'bg-[#008000]'
            : n <= 40
            ? 'bg-[#bc4307]'
            : 'bg-[#d75d1a]'
        "
      >
        {{ n }}
      </div>

      <!-- Divider -->
      <div class="col-span-10 my-0">
        <div class="DividerBar"></div>
      </div>

      <!-- Last 40 numbers -->
      <div
        v-for="n in numbers.slice(40, 80)"
        :key="n"
        @click="$emit('kenoballsclicked', n)"
        class="w-10 h-10 flex items-center justify-center text-lg cursor-pointer select-none rounded-full text-white hover:bg-[#97CA97] hover:scale-110 hover:shadow-[0_0_16px_2px_rgba(0,0,0,0.2)]"
        :class="
          temporaryKenoBalls.includes(n)
            ? 'bg-[#008000]'
            : n < 40
            ? 'bg-[#bc4307]'
            : 'bg-[#d75d1a]'
        "
      >
        {{ n }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.DividerBar {
  height: 1px;
  margin: 5px 20px;
  display: block;
  flex: 1 100%;
  background: linear-gradient(
    270deg,
    rgba(251, 130, 127, 0),
    #fb827f,
    rgba(251, 130, 127, 0)
  );
}
</style>
