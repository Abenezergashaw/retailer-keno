<script setup>
import { computed } from "vue";
import DollarIcon from "./DollarIcon.vue";
import CancelIcon from "./CancelIcon.vue";
const props = defineProps({
  name: String,
  bg: String,
  hover: String,
});
const buttonClasses = computed(() => [
  "h-[34px]",
  "px-3",
  "font-roboto",
  "text-[14.5px]",
  "flex",
  "justify-center",
  "items-center",
  "gap-2",
  "cursor-pointer",
  "rounded",
  "text-white",
  "transition-colors",
  "duration-200",
  `bg-[${props.bg}]`,
  `hover:bg-[${props.hover}]`,
]);
</script>

<template>
  <button :class="buttonClasses" style="color: white">
    {{ name }}
    <DollarIcon v-if="name === 'Redeem'" />

    <CancelIcon v-if="name === 'Cancel'" />
  </button>
</template>
