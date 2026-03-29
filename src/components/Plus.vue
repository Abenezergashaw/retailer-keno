<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  state: {
    type: Boolean,
  },
  color: {
    type: String,
  },
  id: {
    type: Number,
  },
});

const emit = defineEmits();

const isActive = ref(false);

function toggle() {
  // isActive.value = !isActive.value;
  emit("toggle", props.id);
  // console.log("AAA");
}

// Set CSS variable for color
const styleVars = computed(() => ({
  "--toggle-color": `#${props.color}`,
}));
</script>

<template>
  <div
    @click="toggle"
    class="w-8 h-6 cursor-pointer flex pt-0.5 items-start justify-center"
  >
    <button
      :class="[
        'toggle-btn relative w-[1rem] rounded-full flex items-center justify-center',
        { active: state },
      ]"
      :style="styleVars"
    ></button>
  </div>
</template>

<style scoped>
.toggle-btn::before,
.toggle-btn::after {
  content: "";
  position: absolute;
  width: 60%;
  height: 3px;
  background: var(--toggle-color);
  transition: all 0.3s ease;
}

.toggle-btn::before {
  transform: rotate(0deg);
}

.toggle-btn::after {
  transform: rotate(-90deg);
}

.toggle-btn.active::before {
  transform: rotate(0deg) scaleX(0);
}

.toggle-btn.active::after {
  transform: rotate(0deg);
}
</style>
