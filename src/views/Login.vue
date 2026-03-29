<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import CloseIcon from "@/components/CloseIcon.vue";
import ErrorIcon from "@/components/ErrorIcon.vue";
import axios from "axios";
import { useAuthStore } from "@/store/auth";
import { useUrl } from "@/store/url";

const auth = useAuthStore();
const url = useUrl();

const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const generalError = ref(false);
const passwordError = ref(false);
const usernameError = ref(false);
const usernameErrorMessage = ref("");
const passwordErrorMessage = ref("");
const generalErrorMessage = ref("");
const returnUrl = "/";
const token = "";

// console.log(route.query);

if (route.query.msg) {
  generalError.value = true;
  generalErrorMessage.value = route.query.msg;
}

async function login() {
  try {
    // Create form data

    if (username.value === "") {
      usernameError.value = true;
      return;
    } else {
      usernameError.value = false;
    }

    if (password.value === "") {
      passwordError.value = true;
      return;
    } else {
      passwordError.value = false;
    }

    const formData = new URLSearchParams();
    formData.append("ReturnUrl", returnUrl);
    formData.append("Token", token);
    formData.append("Username", username.value);
    formData.append("Password", password.value);
    formData.append("submit", "Enter");

    const response = await axios.post(
      `${url.url}/RetailUser/Login`,
      // {
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      }
    );

    // console.log("Login response:", response.data.message);
    await auth.checkSession();
    router.push("/");
  } catch (error) {
    // console.error("Login failed:", error);
    generalError.value = true;
    generalErrorMessage.value = error.response.data.message;
  }
}

async function checkSession() {
  const res = await axios.get(
    "https://retailer-nine.vercel.app/api/check-session",
    {
      withCredentials: true,
    }
  );
  // console.log("Session check response:", res.data);
  if (res.data.loggedIn) {
    router.push("/");
  }
}

onMounted(async () => {
  const ok = await auth.checkSession();
  if (ok) {
    router.push("/");
  }
  // checkSession();
});
</script>

<template>
  <div class="w-full h-[100vh] bg-[#fcfcfc] flex justify-center pt-[50px]">
    <div
      class="bg-[radial-gradient(ellipse_at_center,rgba(55,179,74,.3)_0%,rgba(255,255,255,0)_65%,rgba(255,255,255,0)_100%)] w-full h-[60vh] flex justify-center items-start"
    >
      <div
        class="bg-white shadow-[0_0_20px_rgba(55,179,74,0.6)] flex items-center justify-center rounded-[20px]"
      >
        <div
          class="flex items-center justify-center pt-[5px] px-[10px] pb-[20px]"
        >
          <form
            action="/RetailUser/Login"
            method="post"
            @submit.prevent="login"
            novalidate
            class="w-full bg-white rounded-[20px] p-1"
          >
            <!-- Hidden fields -->
            <input type="hidden" id="ReturnUrl" name="ReturnUrl" value="/" />
            <input type="hidden" id="Token" name="Token" value="" />

            <!-- Heading -->
            <div class="mb-3 text-center">
              <h2
                class="text-[1.7em] px-[15px] pt-[10px] text-[#37b34a] font-roboto"
              >
                Cashier Login
              </h2>
            </div>

            <transition
              name="fade"
              enter-active-class="transition ease-out duration-500"
              leave-active-class="transition ease-in duration-500"
              enter-from-class="opacity-0 "
              enter-to-class="opacity-100 "
              leave-from-class="opacity-100 "
              leave-to-class="opacity-0 "
            >
              <div
                v-if="generalError"
                class="flex justify-center mb-3 px-1 relative"
              >
                <div
                  class="text-sm bg-gradient-to-b from-[#E4716F] to-[#DB4240] text-white px-2 py-[7px] rounded-[3px] border border-[#db4240] font-roboto w-full flex justify-center items-center gap-2"
                >
                  <div class="flex justify-center items-center gap-1">
                    <ErrorIcon />
                    {{ generalErrorMessage }}
                  </div>

                  <CloseIcon @click="generalError = false" />
                </div>
              </div>
            </transition>

            <!-- Username -->
            <div class="mb-4 flex flex-col items-center">
              <input
                id="Username"
                name="Username"
                type="text"
                placeholder="Username"
                v-model="username"
                required
                class="w-[185px] rounded-[5px] border-[0.5px] border-[#37b34a] px-[3%] text-[.9em] h-[32px] font-roboto text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#101010] focus:border-none outline-none placeholder-gray-500"
              />
            </div>
            <div v-if="usernameError" class="w-full flex justify-center">
              <span
                class="text-xs bg-gradient-to-b from-[#D45B5B] to-[#C62A2A] block text-white px-2 py-[2px] rounded-[3px] border border-[#db4240] font-roboto"
              >
                Username is required.
              </span>
            </div>
            <!-- Password -->
            <div class="mb-3 flex flex-col items-center">
              <input
                id="Password"
                name="Password"
                type="password"
                placeholder="Password"
                v-model="password"
                required
                class="w-[185px] rounded-[5px] border-[0.5px] border-[#37b34a] px-[3%] text-[.9em] h-[32px] font-roboto text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#101010] focus:border-none outline-none placeholder-gray-500"
              />
            </div>
            <div v-if="passwordError" class="w-full flex justify-center">
              <span
                class="text-xs bg-gradient-to-b from-[#D45B5B] to-[#C62A2A] block text-white px-2 py-[2px] rounded-[3px] border border-[#db4240] font-roboto"
              >
                Password is required.
              </span>
            </div>
            <!-- Submit button -->
            <div class="flex items-center justify-center z-10">
              <input
                type="submit"
                id="submit"
                value="Enter"
                class="font-normal mx-auto bg-[#37b34a] hover:bg-[#2B8C3A] text-white font-roboto py-[6px] px-[12px] rounded-md shadow-md transition text-[.9em] cursor-pointer"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
