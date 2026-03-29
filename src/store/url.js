import { defineStore } from "pinia";

export const useUrl = defineStore("url", {
  state: () => ({
    // url: "http://localhost:3000",
    url: "https://playbitman.com",
    // url: "https://retail.gondarmenu.com",
  }),
});
