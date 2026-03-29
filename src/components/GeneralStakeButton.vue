<script setup>
defineProps({
  bg: String,
  stake: Number,
});
</script>

<template>
  <div
    class="h-9  flex-1 flex justify-center items-center rounded-md relative text-white text-[10px] cursor-pointer hover:text-[#fcfcfc] border hover:border-[rgba(55,179,74,.7)] shadow-md"
    :class="`${bg}`"
  >
    <span class="absolute top-0 left-1">Br</span>
    <span class="text-sm">{{ stake }}</span>
  </div>
</template>
