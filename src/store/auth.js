// src/store/auth.js
import { defineStore } from "pinia";
import axios from "axios";
import { useRouter } from "vue-router";
import router from "@/router";
import { useUrl } from "./url";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // will hold user info after login/check-session
  }),
  actions: {
    async checkSession() {
      const url = useUrl();

      try {
        const res = await axios.get(`${url.url}/api/check-session`, {
          withCredentials: true,
        });

        if (res.data.expired) {
          // console.log("expired");
          // router.push({
          //   path: "/RetailUser/Login",
          //   query: { msg: res.data.message },
          // });
          return;
        }

        if (res.data.loggedIn) {
          this.user = res.data.user;
          // console.log(this.user);
          return true;
        } else {
          return false;
        }
      } catch {
        this.user = null;
        return false;
      }
    },

    async logout() {
      const url = useUrl();

      await axios.get(`${url.url}/api/logout`, {
        withCredentials: true,
      });
      router.push("/RetailUser/Login");
      this.user = null;
    },
  },
});
