<script setup>
import { computed } from "vue";

/*
 Props / emits to support v-model:
 - modelValue (Number|null) — current value from parent
 - update:modelValue (emit) — used by v-model to update parent
*/
const props = defineProps({
  modelValue: { type: Number, default: null },
  id: { type: String, default: "number-select" },
  name: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);

// options 1..9
const options = Array.from({ length: 9 }, (_, i) => i + 1);

// local computed binding so we can v-model the <select> directly and emit numbers
const selected = computed({
  get: () => props.modelValue,
  set: (v) => {
    // allow clearing (null) or numeric value
    const value = v === "" || v === null ? null : Number(v);
    emit("update:modelValue", value);
    emit("change", value);
  },
});
</script>

<template>
  <select
    :id="id"
    :name="name"
    v-model="selected"
    :disabled="disabled"
    class="px-0 py-0 border rounded bg-[#e9e9ed] text-black w-[30px] text-sm font-roboto max-w-[200px]"
  >
    <!-- <option value="">Select</option> -->
    <option v-for="n in options" :key="n" :value="n" class="bg-[#e9e9ed]">
      {{ n }}
    </option>
  </select>
</template>

<style scoped>
/* select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: #e9e9ed;
  color: black;
}

/* For Firefox specifically */
option {
  background-color: #e9e9ed;
  color: black;
}

/* For Chrome/Safari (partial control) */
/* select option:checked,
select option:hover {
  background-color: #000 !important;
  color: black;
} */
</style>
