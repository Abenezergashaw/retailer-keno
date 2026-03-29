<script setup>
import { computed } from "vue";

const props = defineProps({
  rating: { type: Number, default: 1.3 },
  max: { type: Number, default: 5 },
  color: { type: String, default: "#37B34A" },
  bgColor: { type: String, default: "#D5EDD8" },
});

// Material-style star path for 24px icon (scaled down to 16px)
const starPath =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

// Calculate how much each star should be filled (0 to 1)
const getStarFill = (index) => {
  return Math.max(0, Math.min(1, props.rating - (index - 1)));
};
</script>

<template>
  <div class="star-rating">
    <svg
      :width="max * 12"
      height="12"
      viewBox="0 0 80 16"
      class="star-svg"
      aria-hidden="true"
    >
      <g
        v-for="index in max"
        :key="index"
        :transform="`translate(${(index - 1) * 16}, 0)`"
      >
        <!-- Background star -->
        <path
          :d="starPath"
          transform="scale(0.6667)"
          :fill="bgColor"
          class="star-bg"
        />
        <!-- Filled portion based on rating -->
        <path
          :d="starPath"
          transform="scale(0.6667)"
          :fill="color"
          class="star-fg"
          :style="{
            clipPath: `inset(0 ${100 - getStarFill(index) * 100}% 0 0)`,
          }"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
}

.star-svg {
  display: block;
}

.star-bg {
  opacity: 0.3;
}

.star-fg {
  transition: clip-path 0.3s ease;
}
</style>
