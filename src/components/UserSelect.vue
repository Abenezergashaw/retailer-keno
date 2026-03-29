<script setup>
import { ref } from "vue";

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);

const selectOption = (option) => {
  emit("update:modelValue", option);
  open.value = false;
};
</script>

<template>
  <div class="relative w-full text-xs mb-4">
    <div class="font-semibold my-1">Retail User</div>
    <div
      class="flex justify-between items-center border border-gray-400 bg-gray-100 rounded px-3 py-1 w-[50%] hover:bg-[#C6BEBA] cursor-pointer"
      @click="open = !open"
    >
      <span class="text-gray-700">
        {{ modelValue || "Select an option" }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-gray-500 transform transition-transform duration-200"
        :class="{ 'rotate-180': open }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>

    <!-- Dropdown List -->
    <div
      v-if="open"
      class="absolute left-0 mt-1 bg-[#37b34a] text-white border border-gray-200 rounded shadow-lg z-10 w-[60%]"
    >
      <div
        v-for="(option, index) in options"
        :key="index"
        class="px-3 py-0.5 hover:bg-[#C6BEBA] cursor-pointer"
        @click="selectOption(option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>
