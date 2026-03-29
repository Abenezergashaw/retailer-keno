<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";
import BalanceTable from "./BalanceTable.vue";
import DateTimePicker from "./DateTimePicker.vue";
import PrintIcon from "./PrintIcon.vue";
import RefreshButton from "./RefreshButton.vue";
import CloseIcon from "./CloseIcon.vue";
import EyeIcon from "./EyeIcon.vue";
import BetSlipIcon from "./BetSlipIcon.vue";
import ResultIcons from "./ResultIcons.vue";
import Export from "./Export.vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useFolderImages } from "@/composables/useFolderImages";

const props = defineProps({
  showCashierModal: { type: Boolean, default: false },
  title: String,
  balanceData: Array,
  balance: Number,
  balanceDataLoader: Boolean,
  recallBets: Array,
  recallBetLoader: Boolean,
  resultLoader: Boolean,
  resultData: Array,
  resultsLoader: Boolean,
  passwordChangeLoader: Boolean,
  passwordChangeState: Boolean,
  passwordChangeMessage: String,
});

// const images = useFolderImages("GreyhoundJackets");

const imageDir = ref(null);

// console.log("Balance", props.balance);

const emit = defineEmits(["close"]);

const selectedResult = ref(null);
const searchID = ref(null);

const currentPassword = ref(null);
const newPassword = ref(null);
const confirmPassword = ref(null);

const isDragging = ref(false);
const isResizing = ref(false);
const resizeDir = ref(null);
const offsetX = ref(0);
const offsetY = ref(0);
const modalRef = ref(null);
const inputRef = ref(null);

const mainTab = ref("report");
const secondTab = ref("cash");

const selectedUser = ref("NB2.cashier2 (NB2.cashier2)");
const users = ["NB2.cashier2 (NB2.cashier2)"];

const totals = props.balanceData.reduce(
  (acc, item) => {
    acc.bets += item.stake;

    if (item.isCancelled === 1) {
      acc.cancellations += item.stake;
    }

    if (item.isRedeemed === 1) {
      acc.redeemed += item.stake * item.odd;
    }

    return acc;
  },
  { bets: 0, cancellations: 0, redeemed: 0 }
);
const keyboard = [1, 2, 3, 4, 5, 6, 7, 8, 9, "L", 0, ""];

function handleDetail(b) {
  let i = null;

  if (b.gamename === "PlatinumHounds") {
    i = "GreyhoundJackets";
  } else if (b.gamename === "DashingDerby" || b.gamename === "HarnessRacing") {
    i = "HorseSilks";
  } else if (b.gamename === "SpeedSkating") {
    i = "SpeedSkating";
  } else if (b.gamename === "SteepleChase") {
    i = "HorseSilks";
  } else if (
    b.gamename === "MotorRacing" ||
    b.gamename === "SingleSeaterMotorRacing"
  ) {
    i = "MaxCarHelmets";
  } else if (b.gamename === "CycleRacing") {
    i = "CyclistHelmets";
  }
  const folderImages = useFolderImages(i);
  imageDir.value = folderImages.images;
  selectedResult.value = b;

  // console.log(imageDir.value.value, i);
}

// const res = computed(() => {
// return selectedResult.result.split(",").map(Number).splice(0,3)
// });

function startDrag(e) {
  if (isResizing.value) return;
  isDragging.value = true;
  const rect = modalRef.value.getBoundingClientRect();
  offsetX.value = e.clientX - rect.left;
  offsetY.value = e.clientY - rect.top;
}

function onDrag(e) {
  if (isDragging.value) {
    modalRef.value.style.left = `${e.clientX - offsetX.value}px`;
    modalRef.value.style.top = `${e.clientY - offsetY.value}px`;
  } else if (isResizing.value) {
    const rect = modalRef.value.getBoundingClientRect();
    if (resizeDir.value.includes("right")) {
      modalRef.value.style.width = `${e.clientX - rect.left}px`;
    }
    if (resizeDir.value.includes("bottom")) {
      modalRef.value.style.height = `${e.clientY - rect.top}px`;
    }
    if (resizeDir.value.includes("left")) {
      const diff = e.clientX - rect.left;
      modalRef.value.style.width = `${rect.width - diff}px`;
      modalRef.value.style.left = `${rect.left + diff}px`;
    }
    if (resizeDir.value.includes("top")) {
      const diff = e.clientY - rect.top;
      modalRef.value.style.height = `${rect.height - diff}px`;
      modalRef.value.style.top = `${rect.top + diff}px`;
    }
  }
}

function stopActions() {
  isDragging.value = false;
  isResizing.value = false;
  resizeDir.value = null;
}

function startResize(e, dir) {
  isResizing.value = true;
  resizeDir.value = dir;
  e.stopPropagation();
}

function getCurrentDateTime() {
  const now = new Date();

  const pad = (num) => String(num).padStart(2, "0");

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // months are 0-based
  const year = now.getFullYear();

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`,
  };
}

function formatDate(d) {
  const iso = "2025-09-10T07:21:52.000Z";
  const date = new Date(d);

  const formatted =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0");

  return formatted;
}

function passZReport(date) {
  emit("printZReport", date);
}

function formatMSDate(msDate) {
  // Extract number from "/Date(1757785800830)/"
  const timestamp = parseInt(msDate.match(/\d+/)[0], 10);
  const date = new Date(timestamp);

  const pad = (n) => n.toString().padStart(2, "0");

  return (
    date.getFullYear() +
    "/" +
    pad(date.getMonth() + 1) +
    "/" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}
function toNairobiTime(utcString) {
  const date = new Date(utcString);

  // Add 3 hours for Nairobi
  date.setHours(date.getUTCHours() + 3);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function handlePasswordChange() {
  if (currentPassword.value === null || currentPassword.value === "") {
    passwordChangeState.value = true;
    passwordChangeMessage.value = "Old password is incorrect";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    return;
  }
  if (
    newPassword.value === null ||
    newPassword.value === "" ||
    confirmPassword.value === null ||
    confirmPassword.value === ""
  ) {
    passwordChangeState.value = true;
    passwordChangeMessage.value = "All fields are required";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    return;
  }

  if (newPassword !== confirmPassword) {
    passwordChangeState.value = true;
    passwordChangeMessage.value = "The specified password do not match.";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    return;
  }
}

function exportTableToExcel(tableId, filename = "Events Export.xlsx") {
  const table = document.getElementById("resultTable");
  const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);
}

function exportBalance(tableId, filename = "Report Export.xlsx") {
  const table = document.getElementById("reportTable");
  const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);
}

onMounted(() => {
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopActions);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopActions);
});
</script>

<template>
  <div
    v-if="showCashierModal"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div
      ref="modalRef"
      class="absolute bg-white shadow-lg rounded min-w-[250px] min-h-[150px] overflow-auto"
      style="
        animation: scaleIn 0.5s ease-out forwards;
        width: 98vw;
        /* min-height: 200px; */
        max-height: 98vh;
      "
    >
      <div
        class="bg-[#37b34a] text-white px-3 py-2 rounded-t-md flex justify-between items-center"
        @mousedown="startDrag"
      >
        <span class="font-roboto">{{ title }} </span>
        <button
          @click="
            $emit('close');
            mainTab = 'report';
            secondTab = 'cash';
            searchID = null;
          "
          class="fill-[#bfbfbf] text-[#1f652a] hover:fill-[#57BF67] hover:text-[#818382]"
        >
          <CloseIcon />
        </button>
      </div>

      <div class="p-4 h-[calc(100%-40px)] overflow-auto relative">
        <div
          class="text-[#37b34a] text-lg font-roboto flex justify-end gap-1 items-center tracking-wide"
        >
          <span class="">Cash Balance:</span>
          <span class="font-bold"> Br {{ balance.toFixed(2) }}</span>
          <div
            class="px-2 py-1 rounded-md border border-[#37b34a] cursor-pointer hover:bg-[#F1FBF2]"
            @click="$emit('refreshBalance')"
          >
            <svg
              viewBox="0 0 512 512"
              width="15"
              height="15"
              class="fill-current text-[#37b34a]"
            >
              <path
                d="M480 288c0 123.7-100.3 224-224 224S32 411.7 32 288 132.3 64 256 64V0l160 96-160 96v-64c-88.2 0-160 71.8-160 160s71.8 160 160 160 160-71.8 160-160c0-29.1-7.8-56.4-21.5-80l55.5-32c19.1 32.9 30 71.2 30 112"
              ></path>
            </svg>
          </div>
        </div>
        <div
          class="w-full h-full flex flex-col justify-start items-start mt-3"
          style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif"
        >
          <div class="flex justify-between gap-1 w-full">
            <div class="flex gap-1">
              <div
                @click="mainTab = 'report'"
                class="px-2.5 py-1 rounded-t text-sm cursor-pointer border border-[#C3E8C8] transition-colors duration-300"
                :class="mainTab === 'report' ? 'bg-[#37b34a]' : ''"
              >
                Reports
              </div>
              <div
                @click="
                  mainTab = 'result';
                  $emit('getResults');
                "
                class="border px-2.5 py-1 rounded-t text-sm cursor-pointer border-[#C3E8C8] transition-colors duration-300"
                :class="
                  mainTab === 'result' || mainTab === 'details'
                    ? 'bg-[#37b34a]'
                    : ''
                "
              >
                Event Result Search
              </div>
            </div>

            <div
              @click="mainTab = 'password'"
              class="border border-[#C3E8C8] transition-colors duration-300 px-2.5 py-1 rounded-t text-sm cursor-pointer"
              :class="mainTab === 'password' ? 'bg-[#37b34a]' : ''"
            >
              Change Password
            </div>
          </div>
          <div
            v-if="mainTab === 'report'"
            class="w-full mb-2 border border-[#37b34a] py-4 px-4"
          >
            <div class="flex justify-between gap-1 w-full">
              <div class="flex gap-1">
                <div
                  @click="secondTab = 'cash'"
                  class="px-2.5 py-1 rounded-t text-sm cursor-pointer border border-[#C3E8C8] transition-colors duration-300"
                  :class="secondTab === 'cash' ? 'bg-[#37b34a]' : ''"
                >
                  Cash Summary
                </div>
                <div
                  @click="
                    secondTab = 'recall';
                    $emit('getRecallBets');
                  "
                  class="px-2.5 py-1 rounded-t text-sm cursor-pointer border border-[#C3E8C8] transition-colors duration-300"
                  :class="secondTab === 'recall' ? 'bg-[#37b34a]' : ''"
                >
                  Recall Bets
                </div>
              </div>
            </div>
            <div class="w-full border border-[#37b34a] py-4 px-4">
              <div
                v-if="secondTab === 'cash'"
                class="w-full border-[1px] border-[#D5D5D5] py-4 px-0"
              >
                <div class="flex gap-8 ml-4">
                  <div
                    class="relative w-full max-w-xs flex flex-col items-start justify-start gap-1"
                  >
                    <span class="text-xs font-semibold text-center"
                      >From Date</span
                    >
                    <DateTimePicker time="00:00:00" />
                  </div>
                  <div
                    class="relative w-full max-w-xs flex flex-col items-start justify-start gap-1"
                  >
                    <span class="text-xs font-semibold text-center"
                      >To Date</span
                    >
                    <DateTimePicker time="23:59:59" />
                  </div>
                </div>

                <div
                  class="w-full flex justify-start gap-2 text-[#37b34a] mt-4 ml-4"
                >
                  <RefreshButton @click="$emit('getBalanceData')" />
                  <Export @click="exportBalance()" />
                </div>

                <BalanceTable
                  :balanceData="balanceData"
                  :balanceDataLoader="balanceDataLoader"
                  @printZReport="passZReport"
                />
              </div>

              <div
                v-if="secondTab === 'recall'"
                class="w-full border-[1px] border-[#D5D5D5]py-4"
              >
                <div class="ml-4 flex flex-col">
                  <UserSelect v-model="selectedUser" :options="users" />
                </div>

                <div
                  class="w-full flex justify-start text-[#37b34a] mt-0 ml-4 mb-2"
                >
                  <RefreshButton @click="$emit('getRecallBets')" />
                </div>

                <table
                  class="min-w-full border border-gray-100 divide-y text-xs"
                >
                  <thead class="">
                    <tr>
                      <th
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Retail User
                      </th>
                      <th
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Date
                      </th>
                      <th
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Stake
                      </th>
                      <th
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Description
                      </th>
                      <th
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      ></th>
                    </tr>
                  </thead>
                  <tbody class="">
                    <div
                      v-if="recallBetLoader"
                      class="w-full absolute flex items-center justify-center bg-opacity-20"
                    >
                      <img
                        src="../assets/images/loading-image.gif"
                        alt="Loading..."
                      />
                    </div>
                    <tr
                      v-if="recallBets.length > 0 && !recallBetLoader"
                      v-for="b in recallBets"
                      class="border-b hover:bg-[#C5BDB9]"
                    >
                      <td
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        {{ b.user }}.{{ b.cashier }}
                      </td>
                      <td
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        {{ formatDate(b.createdAt) }}
                      </td>
                      <td
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Br {{ b.stake.toFixed(2) }}
                      </td>
                      <td
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        Single, {{ b.game }} {{ b.gameId }}
                      </td>
                      <td
                        class="px-4 py-2 text-left font-medium border-r truncate"
                      >
                        <PrintIcon @click="$emit('copyTicket', b.ticketId)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            v-if="mainTab === 'result'"
            class="w-full border border-[#37b34a] py-4 px-4"
          >
            <div class="flex gap-8 ml-4">
              <div
                class="relative w-full max-w-xs flex flex-col items-start justify-start gap-1"
              >
                <span class="text-xs font-semibold text-center">From Date</span>
                <DateTimePicker />
              </div>
              <div
                class="relative w-full max-w-xs flex flex-col items-start justify-start gap-1"
              >
                <span class="text-xs font-semibold text-center">To Date</span>
                <DateTimePicker />
              </div>

              <div
                class="relative w-full max-w-xs flex flex-col items-start justify-start gap-1"
              >
                <span class="text-xs font-semibold text-center">Event No</span>
                <input
                  type="text"
                  v-model="searchID"
                  @keyup.enter="$emit('searchResult', searchID)"
                  class="border border-gray-300 rounded px-1 text-xs w-full py-1"
                />
              </div>
            </div>
            <div
              class="w-full flex justify-start gap-2 text-[#37b34a] mt-4 ml-4 mb-2"
            >
              <RefreshButton @click="$emit('getResults')" />
              <Export @click="exportTableToExcel()" />
              <div
                v-if="false"
                class="text-xs border border-[#37b34a] px-2.5 py-1 rounded flex gap-1 text-[#333] cursor-pointer hover:bg-[#F1FBF2]"
                @click="$emit('getRecallBets')"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="#37b34a"
                  class="text-[#37b34a]"
                >
                  <!-- Outer circle -->
                  <path
                    d="M8 3a5 5 0 1 0 4.546 2.914"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                  ></path>

                  <!-- Arrow head -->
                  <path
                    d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
                    fill="#37b34a"
                    class="text-[#37b34a]"
                  />
                </svg>
                Export To Excel
              </div>
            </div>

            <table
              id="resultTable"
              class="min-w-full border border-gray-100 divide-y text-xs"
            >
              <thead class="">
                <tr>
                  <th class="px-4 py-2 text-left font-medium border-r truncate">
                    Game
                  </th>
                  <th class="px-4 py-2 text-left font-medium border-r truncate">
                    Feed ID
                  </th>
                  <th class="px-4 py-2 text-left font-medium border-r truncate">
                    Event No
                  </th>
                  <th class="px-4 py-2 text-left font-medium border-r truncate">
                    Date
                  </th>
                  <th
                    class="px-4 py-2 text-left font-medium border-r truncate"
                  ></th>
                  <th
                    class="px-4 py-2 text-left font-medium border-r truncate"
                  ></th>
                </tr>
              </thead>
              <tbody class="">
                <div
                  v-if="resultsLoader"
                  class="w-full absolute flex items-center justify-center bg-opacity-20"
                >
                  <img
                    src="../assets/images/loading-image.gif"
                    alt="Loading..."
                  />
                </div>
                <tr
                  v-if="resultData.length > 0 && !resultLoader"
                  v-for="(b, i) in resultData"
                  class="border-b hover:bg-[#C5BDB9]"
                  :class="`${i % 2 === 0 ? 'bg-[#efefef]' : ''}`"
                >
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    {{ b.gamename }}
                  </td>
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    {{ b.eventid }}
                  </td>
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    {{ b.gameid }}
                  </td>
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    {{ toNairobiTime(b.date) }}
                  </td>
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    <EyeIcon
                      @click="
                        mainTab = 'details';
                        handleDetail(b);
                      "
                    />
                  </td>
                  <td class="px-4 py-1 text-left font-medium border-r truncate">
                    <PrintIcon @click="$emit('printResult', b.eventid)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="mainTab === 'details'"
            class="w-full border border-[#37b34a] py-4 px-4 relative"
          >
            <div
              @click="
                mainTab = 'result';
                $emit('getResults');
              "
              class="flex gap-1 items-center border rounded absolute px-2 py-1 text-xs hover border-[#ccc] text-[#333] hover:bg-[#e6e6e6] hover:border-[#adadad] cursor-pointer transition-all duration-300 top-2 right-2"
            >
              <svg class="w-4 h-4 text-black" viewBox="0 0 512 512">
                <path
                  d="m353.941 382.059-126.06-126.06 126.06-126.061L320 96 160 255.999 320 416z"
                ></path>
              </svg>
              Back To List
            </div>

            <div
              class="flex justify-start items- gap-3 border-b border-[#e1e1e1]"
            >
              <ResultIcons :game="selectedResult.gamename" />

              <div class="flex flex-col gap-0 uppercase text-[#8c8c8c]">
                <span>{{ selectedResult.place || "" }}</span>
                <span
                  >{{ toNairobiTime(selectedResult.date) }} ID
                  {{ selectedResult.gameid }}</span
                >
              </div>
            </div>

            <div
              class="text-[#8c8c8c] flex flex-col gap-4 items-center justify-center"
            >
              <span>RESULTS</span>
              <div class="flex justify-between gap-24 text-sm">
                <div>
                  <img
                    :src="`${
                      selectedResult.gamename === 'PlatinumHounds' ||
                      selectedResult.gamename === 'MotorRacing' ||
                      selectedResult.gamename === 'CycleRacing' ||
                      selectedResult.gamename === 'SingleSeaterMotorRacing'
                        ? imageDir.value[
                            selectedResult.result.split(',').map(Number)[0] - 1
                          ]
                        : imageDir.value[Math.floor(Math.random() * 40) + 1]
                    }`"
                    alt=""
                  />
                  {{ selectedResult.first }}
                </div>
                <div>
                  <img
                    :src="`${
                      selectedResult.gamename === 'PlatinumHounds' ||
                      selectedResult.gamename === 'MotorRacing' ||
                      selectedResult.gamename === 'CycleRacing' ||
                      selectedResult.gamename === 'SingleSeaterMotorRacing'
                        ? imageDir.value[
                            selectedResult.result.split(',').map(Number)[1] - 1
                          ]
                        : imageDir.value[Math.floor(Math.random() * 40) + 1]
                    }`"
                    alt=""
                  />
                  {{ selectedResult.second }}
                </div>
                <div>
                  <img
                    :src="`${
                      selectedResult.gamename === 'PlatinumHounds' ||
                      selectedResult.gamename === 'MotorRacing' ||
                      selectedResult.gamename === 'CycleRacing' ||
                      selectedResult.gamename === 'SingleSeaterMotorRacing'
                        ? imageDir.value[
                            selectedResult.result.split(',').map(Number)[2] - 1
                          ]
                        : imageDir.value[Math.floor(Math.random() * 40) + 1]
                    }`"
                    alt=""
                  />
                  {{ selectedResult.third }}
                </div>
              </div>
            </div>
            <hr class="w-full border-8 mt-4" />
            <div class="text-[#8c8c8c] text-sm text-center my-2">
              Number of Participants:
              {{ selectedResult.result.split(",").map(Number).length }}
            </div>
          </div>

          <div
            v-if="mainTab === 'password'"
            class="w-full border border-[#37b34a] py-4 px-4 flex flex-col gap-2 relative"
          >
            <div
              v-if="passwordChangeLoader"
              class="w-full absolute flex items-center justify-center bg-opacity-20 top-10"
            >
              <img src="../assets/images/loading-image.gif" alt="Loading..." />
            </div>
            <div class="flex justify-start gap-10 text-sm">
              <div class="flex-1 font-semibold">Current Password</div>
              <div class="flex-1">
                <input
                  type="text"
                  v-model="currentPassword"
                  class="border border-[#37b34a] rounded px-1 text-xs w-[180px] py-1"
                />
              </div>
            </div>
            <div class="flex justify-start gap-10 text-sm">
              <div class="flex-1 font-semibold">New Password</div>
              <div class="flex-1">
                <input
                  type="text"
                  v-model="newPassword"
                  class="border border-[#37b34a] rounded px-1 text-xs w-[180px] py-1"
                />
              </div>
            </div>
            <div class="flex justify-start gap-10 text-sm">
              <div class="flex-1 font-semibold">Confirm Password</div>
              <div class="flex-1">
                <input
                  type="text"
                  v-model="confirmPassword"
                  class="border border-[#37b34a] rounded px-1 text-xs w-[180px] py-1"
                />
              </div>
            </div>

            <div
              v-if="passwordChangeState"
              class="bg-gradient-to-b text-white from-[#D45D5D] to-[#C72E2E] text-sm rounded px-2 py-0"
            >
              {{ passwordChangeMessage }}
            </div>

            <div
              @click="
                $emit(
                  'changePassword',
                  currentPassword,
                  newPassword,
                  confirmPassword
                )
              "
              class="font-roboto bg-[#37b34a] border border-[#37b34a] py-1.5 rounded flex justify-center items-center text-white cursor-pointer hover:bg-[#2B8C3A] px-2 w-16 text-sm"
            >
              Enter
            </div>
          </div>
        </div>
      </div>

      <!-- Resize handles -->
      <div
        class="absolute top-0 left-0 w-2 h-full cursor-w-resize"
        @mousedown="startResize($event, 'left')"
      ></div>
      <div
        class="absolute top-0 right-0 w-2 h-full cursor-e-resize"
        @mousedown="startResize($event, 'right')"
      ></div>
      <div
        class="absolute top-0 left-0 w-full h-2 cursor-n-resize"
        @mousedown="startResize($event, 'top')"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-full h-2 cursor-s-resize"
        @mousedown="startResize($event, 'bottom')"
      ></div>

      <!-- Corners -->
      <div
        class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        @mousedown="startResize($event, 'top left')"
      ></div>
      <div
        class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        @mousedown="startResize($event, 'top right')"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        @mousedown="startResize($event, 'bottom left')"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        @mousedown="startResize($event, 'bottom right')"
      ></div>
    </div>
  </div>
</template>

<style>
@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    /* transform: scale(0.8); */
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
