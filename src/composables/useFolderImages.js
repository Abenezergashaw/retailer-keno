import { ref, watchEffect } from "vue";

export function useFolderImages(folderName) {
  const images = ref([]);

  // Pre-import all known folders (static globbing)
  const allFolders = {
    HorseSilks: import.meta.glob("../assets/images/HorseSilks/*.png", {
      eager: true,
    }),
    GreyhoundJackets: import.meta.glob(
      "../assets/images/GreyhoundJackets/*.png",
      { eager: true }
    ),
    CyclistHelmets: import.meta.glob("../assets/images/CyclistHelmets/*.png", {
      eager: true,
    }),
    MaxCarHelmets: import.meta.glob("../assets/images/MaxCarHelmets/*.png", {
      eager: true,
    }),
    SpeedSkating: import.meta.glob("../assets/images/SpeedSkating/*.png", {
      eager: true,
    }),
  };

  watchEffect(() => {
    if (folderName && allFolders[folderName]) {
      images.value = Object.entries(allFolders[folderName])
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([, img]) => img.default);
    } else {
      images.value = [];
    }
  });
  return { images };
}
