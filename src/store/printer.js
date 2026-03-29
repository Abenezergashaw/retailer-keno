import { defineStore } from "pinia";

export const useCheckPrinterStatus = defineStore("printer", {
  state: () => ({
    online: false,
  }),
  actions: {
    changePrinterState(state) {
      this.online = state;
    },
  },
});
