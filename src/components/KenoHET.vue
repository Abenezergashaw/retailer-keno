<script setup>
import { ref } from "vue";

defineProps({
  name: String,
  value: Number,
  color: String,
});
</script>

<template>
  <div
    class="px-2 rounded-[3px] flex gap-16 items-center font-roboto py-0.5"
    :class="`bg-[${color}]`"
  >
    <span>{{ name }}</span>
    <div
      class="bg-[#ffff80] text-[#111] px-6 rounded-[3px] cursor-pointer hover:bg-[#257832] transition-colors duration-300 font-semibold border-[1px] border-[#37b34a] hover:border-[#257832] hover:text-[#111]"
    >
      {{ value }}
    </div>
  </div>
</template>
