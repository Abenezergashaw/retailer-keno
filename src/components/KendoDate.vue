<script setup>
import { ref } from "vue";
import { DateTimePicker } from "@progress/kendo-vue-dateinputs";

const value = ref(new Date()); // default selected date

function refreshSummaryGrid(e) {
  // console.log("New date selected:", e.value);
}
</script>

<template>
  <div>
    <DateTimePicker
      v-model="value"
      :format="'yyyy/MM/dd HH:mm:ss'"
      :min="new Date(1900, 0, 1)"
      :max="new Date(2099, 11, 31)"
      :steps="{ minute: 30 }"
      @change="refreshSummaryGrid"
    />
  </div>
</template>
