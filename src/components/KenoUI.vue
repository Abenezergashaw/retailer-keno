<script setup>
import { ref, watch, computed, onUnmounted, onMounted, nextTick } from "vue";
import KenoMultipleBetSelect from "./KenoMultipleBetSelect.vue";
import ShuffleIcon from "./ShuffleIcon.vue";
import KenoHET from "./KenoHET.vue";
import KenoBalls from "./KenoBalls.vue";
import CountdownKeno from "./CountdownKeno.vue";

const chosenMultipleBetselect = ref(1);
const randomQuickPick = ref(null);

const props = defineProps({
  info: {
    type: Array,
    required: true,
  },
  eventDetail: {
    type: Object,
  },
  temporaryKenoBalls: Array,
  selectedBets: Array,
});

watch(
  () => randomQuickPick.value,
  (newVal) => {
    emit("quickRandomSelect", newVal);
  },
);

const emit = defineEmits();

function parseDate(str) {
  return parseInt(str.replace(/[^0-9]/g, ""), 10);
}
const localInfo = ref([]);
const currentGame = ref({});

const analyzeData = (gameData) => {
  // // 1. Dig into the nested data
  // const gameData = props.info?.data?.Data;

  if (!Array.isArray(gameData)) return null;

  const now = Date.now();
  const sorted = [...gameData].sort(
    (a, b) => parseDate(a.AdjustedStartTime) - parseDate(b.AdjustedStartTime),
  );

  const future = sorted.filter((g) => parseDate(g.AdjustedStartTime) > now);
  const next = future[0];

  // 3. Find the first item where IsNext is true
  currentGame.value = next;
};

setTimeout(() => {
  console.log(currentGame.value, ";;;;00000");
}, 1000);

const payoutForm = computed(() => {
  if (props.temporaryKenoBalls.length === 1) {
    return [{ a: 1, b: 3.8 }];
  } else if (props.temporaryKenoBalls.length === 2) {
    return [{ a: 2, b: 15 }];
  } else if (props.temporaryKenoBalls.length === 3) {
    return [
      { a: 2, b: 3 },
      { a: 3, b: 35 },
    ];
  } else if (props.temporaryKenoBalls.length === 4) {
    return [
      { a: 2, b: 1 },
      { a: 3, b: 8 },
      { a: 4, b: 100 },
    ];
  } else if (props.temporaryKenoBalls.length === 5) {
    return [
      { a: 2, b: 1 },
      { a: 3, b: 3 },
      { a: 4, b: 15 },
      { a: 5, b: 300 },
    ];
  } else if (props.temporaryKenoBalls.length === 6) {
    return [
      { a: 3, b: 1 },
      { a: 4, b: 10 },
      { a: 5, b: 70 },
      { a: 6, b: 1800 },
    ];
  } else if (props.temporaryKenoBalls.length === 7) {
    return [
      { a: 0, b: 1 },
      { a: 3, b: 1 },
      { a: 4, b: 6 },
      { a: 5, b: 12 },
      { a: 6, b: 120 },
      { a: 7, b: 2150 },
    ];
  } else if (props.temporaryKenoBalls.length === 8) {
    return [
      { a: 0, b: 1 },
      { a: 4, b: 4 },
      { a: 5, b: 8 },
      { a: 6, b: 68 },
      { a: 7, b: 600 },
      { a: 8, b: 3000 },
    ];
  } else if (props.temporaryKenoBalls.length === 9) {
    return [
      { a: 0, b: 1 },
      { a: 4, b: 3 },
      { a: 5, b: 6 },
      { a: 6, b: 18 },
      { a: 7, b: 120 },
      { a: 8, b: 1800 },
      { a: 9, b: 4200 },
    ];
  } else if (props.temporaryKenoBalls.length === 10) {
    return [
      { a: 0, b: 1 },
      { a: 4, b: 2 },
      { a: 5, b: 4 },
      { a: 6, b: 12 },
      { a: 7, b: 140 },
      { a: 8, b: 400 },
      { a: 9, b: 2500 },
      { a: 10, b: 5000 },
    ];
  }

  return []; // or null, depending on what you expect
});

watch(
  () => payoutForm.value,
  (newVal) => {
    console.log(newVal);
  },
);

watch(
  () => props.info?.data?.Data,
  (newData) => {
    analyzeData(newData);
    console.log("Data changed, analyzing...");
  },
  { immediate: true, deep: true },
);

function handlekenoballsclicked(n) {
  emit("kenoballsclicked", n);
}

function finishedKenoCountdown() {
  emit("finished");
  nextTick(() => {
    setTimeout(() => {
      analyzeData(props.info?.data?.Data);
    }, 1000);
  });
}

onMounted(() => {
  document.addEventListener(
    "visibilitychange",
    analyzeData(props.info?.data?.Data),
  );
});

onUnmounted(() => {
  props.info = [];
});

// watch(
//   () => props.info.data.Data,
//   (newVal) => {
//     const now = Date.now();
//     let startedIndex = -1;
//     // console.log("Changing");
//     // First pass: detect started game
//     localInfo.value = newVal.map((item, index) => {
//       const start = parseDate(item.AdjustedStartTime);
//       const finish = parseDate(item.AdjustedFinishTime);

//       // now > start ? console.log("Greater") : console.log("Lesser");

//       if (now >= start - 500 && now <= finish + 500) {
//         // console.log("Game started", item.EventId);
//         startedIndex = index;
//         return {
//           ...item,
//           started: true,
//           IsNext: false,
//           isExpanded: false,
//         };
//       }

//       return {
//         ...item,
//         started: false,
//         IsNext: item.IsNext || false,
//         isExpanded: item.IsNext ? true : false,
//       };
//     });

//     // Second pass: promote next game if one started
//     if (startedIndex !== -1 && localInfo.value[startedIndex + 1]) {
//       localInfo.value[startedIndex + 1] = {
//         ...localInfo.value[startedIndex + 1],
//         IsNext: true,
//         isExpanded: true,
//       };
//     }

//     localInfo.value.forEach((item) => {
//       if (item.IsNext) {
//         onStartLoadEventDetail(item.EventId, item.ID);
//       }
//     });
//   },
//   { immediate: true }
// );
</script>

<template>
  <div class="px-4">
    <div
      class="flex justify-start text-white gap-0 tracking-wide rounded-lg font-roboto text-base"
    >
      <div
        class="bg-[#ff0000] px-2 rounded-l-[3px] min-w-[160px] flex gap-2 justify-between items-center"
      >
        NEXT DRAW
        <CountdownKeno
          :key="currentGame?.ID || currentGame?.EventId"
          :timestamp="parseInt(currentGame?.AdjustedStartTime?.match(/\d+/)[0])"
          @finished="finishedKenoCountdown"
        />
      </div>
      <div class="bg-[#09B517] px-2 rounded-r-[3px]">
        REPEAT
        <KenoMultipleBetSelect v-model="chosenMultipleBetselect" />
      </div>
    </div>

    <div
      class="flex flex-col lg:flex-row gap-2 lg:gap-6 text-white mt-2.5 w-full"
    >
      <div
        class="bg-[#008000] px-2 rounded-[3px] flex gap-2 items-center font-roboto py-1 max-w-[200px] min-w-[180px]"
      >
        <span>QUICK PICK</span>
        <KenoMultipleBetSelect v-model="randomQuickPick" />
        <span>|</span>
        <ShuffleIcon />
      </div>

      <div class="flex gap-1">
        <KenoHET
          class="cursor-pointer"
          @click="
            $emit(
              'addToBetSlipp',
              currentGame.EventId,
              'Heads',
              currentGame.TypeName,
              2,
              currentGame.StartDateTimeAsWords,
              currentGame.Number,
              '',
              currentGame.TypeName,
              currentGame.ID,
              payoutForm,
              'Heads and Tails',
            )
          "
          name="HEADS"
          value="2"
          :color="
            selectedBets.some((b) => b.betType === 'Heads')
              ? '#257832'
              : '#bc4307'
          "
        />
        <KenoHET
          class="cursor-pointer"
          @click="
            $emit(
              'addToBetSlipp',
              currentGame.EventId,
              'Evens',
              currentGame.TypeName,
              4,
              currentGame.StartDateTimeAsWords,
              currentGame.Number,
              '',
              currentGame.TypeName,
              currentGame.ID,
              payoutForm,
              'Heads and Tails',
            )
          "
          name="EVENS"
          value="4"
          :color="
            selectedBets.some((b) => b.betType === 'Evens')
              ? '#257832'
              : '#FB827F'
          "
        />
        <KenoHET
          class="cursor-pointer"
          @click="
            $emit(
              'addToBetSlipp',
              currentGame.EventId,
              'Tails',
              currentGame.TypeName,
              2,
              currentGame.StartDateTimeAsWords,
              currentGame.Number,
              '',
              currentGame.TypeName,
              currentGame.ID,
              payoutForm,
              'Heads and Tails',
            )
          "
          name="TAILS"
          value="2"
          :color="
            selectedBets.some((b) => b.betType === 'Tails')
              ? '#257832'
              : '#bc4307'
          "
        />
      </div>

      <div
        @click="
          $emit('clearTempoBalls');
          randomQuickPick = null;
        "
        class="text-white bg-[#fb827f] border-0 text-base font-normal uppercase cursor-pointer px-3 py-1.5 m-0 rounded-none hover:border-transparent hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_0_0_black] transition-all duration-400 flex items-center max-w-[100px]"
      >
        Clear

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-trash-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"
          />
        </svg>
      </div>
    </div>

    <div class="w-full flex">
      <KenoBalls
        :temporaryKenoBalls="temporaryKenoBalls"
        @kenoballsclicked="handlekenoballsclicked"
      />
      <div class="w-[24%]">
        <div
          v-if="temporaryKenoBalls.length === 0"
          class="hidden lg:flex justify-center pt-6"
        >
          <div class="TutorialPanel">
            Pick 1 to 10 numbers from 80. Pick which numbers you think will be
            randomly selected. The more you pick the more you could win.
          </div>
        </div>

        <div
          v-if="temporaryKenoBalls.length > 0"
          class="flex flex-col gap-2 items-center justify-center pt-6 font-roboto"
        >
          <button
            @click="
              // if (!placingBet) {
              $emit(
                'addToBetSlip',
                currentGame.EventId,
                'keno',
                currentGame.TypeName,
                '',
                currentGame.StartDateTimeAsWords,
                currentGame.Number,
                '',
                currentGame.TypeName,
                currentGame.ID,
                payoutForm,
                'Win',
              )
              // }
            "
            class="ConfirmButton shadow-[1px_1px_10px_rgba(0,0,0,0.4)] tracking-wider font-normal uppercase cursor-pointer bg-[#09b517] px-3 py-2 border border-[#fcfcfc] text-white text-base rounded-[3px] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),_0_0_0_black] transition-shadow duration-200 font-roboto outline-none"
          >
            Add To Betslip
          </button>

          <div
            class="p-1 text-white flex flex-col justify-center items-center font-roboto"
          >
            <span class="bg-[#37b34a] py-1 px-1 min-w-[240px]"
              >HIGEST PAYOUT {{ payoutForm[payoutForm.length - 1].b }} FROM
              {{ temporaryKenoBalls.length }}</span
            >
            <div
              class="bg-[#D5EED9] flex justify-around border-b border-[#ccc] w-[190px]"
              v-for="p in payoutForm"
            >
              <div class="py-0.5 flex-1 text-[#8c8c8c] text-center">
                {{ p.a }}
              </div>
              <div class="py-0.5 flex-1 text-[#8c8c8c] text-center">
                {{ p.b }}
              </div>
            </div>

            <div class="flex">
              <span class="px-8 text-[#8c8c8c]">Hits</span>
              <span class="px-8 text-[#8c8c8c]">Pays</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.TutorialPanel {
  background-color: #727272;
  color: #fff;
  padding: 20px;
  margin: 10px;
  border-radius: 3px;
  position: relative;
  width: fit-content;
}

/* the small arrow on the left */
.TutorialPanel::before {
  content: "";
  background-color: #727272;
  width: 20px;
  height: 20px;
  position: absolute;
  left: -10px; /* half outside */
  top: 35%;
  transform: rotate(45deg);
}
</style>
