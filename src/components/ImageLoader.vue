<template>
  <div class="flex flex-wrap gap-2">
    <img
      v-for="(img, index) in images"
      :key="index"
      :src="img"
      class="w-12 h-12 object-contain"
      alt="loaded image"
    />
  </div>
</template>

<script setup>
import { ref, watchEffect } from "vue";

const props = defineProps({
  folder: {
    type: String,
    required: true, // e.g. "HorseSilks"
  },
});

const images = ref([]);

const folderMap = {
  HorseSilks: import.meta.glob("../assets/Images/HorseSilks/*.png", {
    eager: true,
  }),
  GreyhoundJackets: import.meta.glob("../assets/GreyhoundJackets/*.png", {
    eager: true,
  }),
  CyclistHelmets: import.meta.glob("../assets/CyclistHelmets/*.png", {
    eager: true,
  }),
  MaxCarHelmets: import.meta.glob("../assets/MaxCarHelmets/*.png", {
    eager: true,
  }),
  SpeedSkating: import.meta.glob("../assets/SpeedSkating/*.png", {
    eager: true,
  }),
};

watchEffect(() => {
  const folder = folderMap[props.folder];
  if (folder) {
    images.value = Object.values(folder).map((img) => img.default);
  } else {
    images.value = [];
  }
});
</script>
