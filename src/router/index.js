import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/RetailUser/Login",
      name: "Login",
      component: Login,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!auth.user) {
      const ok = await auth.checkSession();
      if (!ok) return next({ name: "Login" });
    }
  }
  next();
});

export default router;
