<script setup>
import Plus from "./Plus.vue";
import { ref, computed, watch, nextTick, onMounted } from "vue";
import SingleRaceGameDisplay from "./SingleRaceGameDisplay.vue";
import Countdown from "./Countdown.vue";

const props = defineProps({
  info: {
    type: Array,
    required: true,
  },
  eventDetail: {
    type: Object,
  },
  trackingSelectedNumbers: {
    type: Array,
  },
  isKeno: Boolean,
  imageDir: Array,
  comboSelections: Object,
  placingBet: Boolean,
});

// console.log("****", props.info);

const emit = defineEmits(["finished", "winClicked"]);

function parseDate(str) {
  return parseInt(str.replace(/[^0-9]/g, ""), 10);
}

watch(
  () => props.isKeno,
  (newVal) => {
    console.log("Updated events:", newVal);
  }
);

const localInfo = ref([]);
const timestamp = ref(null);

// const now = Date.now();

function analyzeData(newData) {
  if (!Array.isArray(newData)) return;

  const now = Date.now();
  const sorted = [...newData].sort(
    (a, b) => parseDate(a.AdjustedStartTime) - parseDate(b.AdjustedStartTime)
  );

  const past = sorted.filter((g) => parseDate(g.AdjustedFinishTime) < now);
  const live = sorted.find((g) => {
    const start = parseDate(g.AdjustedStartTime);
    const end = parseDate(g.AdjustedFinishTime);
    return start <= now && now <= end;
  });

  const future = sorted.filter((g) => parseDate(g.AdjustedStartTime) > now);
  const lastPast = past.at(-1);
  const next = future[0];

  // Instead of replacing whole array:
  localInfo.value.length = 0; // clear
  for (const g of [
    ...(lastPast ? [lastPast] : []),
    ...(live ? [live] : []),
    ...future,
  ]) {
    const start = parseDate(g.AdjustedStartTime);
    const flags = {
      IsFinished: !!(
        lastPast && start === parseDate(lastPast.AdjustedStartTime)
      ),
      started: !!(live && start === parseDate(live.AdjustedStartTime)),
      IsNext: !!(next && start === parseDate(next.AdjustedStartTime)),
    };
    localInfo.value.push({ ...g, ...flags, isExpanded: flags.IsNext });
  }

  localInfo.value.forEach((item) => {
    if (item.IsNext) {
      timestamp.value = item.AdjustedStartTime.match(/\d+/)[0];
      console.log("Timestamp: ", timestamp.value);
    }
  });
}

watch(
  () => props.info?.data?.Data,
  (newData) => analyzeData(newData),
  { immediate: true, deep: true }
);

watch(
  () => localInfo.value,
  (newVal) => {
    newVal.forEach((item) => {
      if (item.IsNext) {
        onStartLoadEventDetail(item.EventId, item.ID);
      }
    });
  },
  {
    immediate: true,
    deep: true,
  }
);

// localInfo.value = props.info?.data?.Data?.map((item, index, arr) => {
//   // if (!props.isKeno) {
//   const start = parseDate(item.AdjustedStartTime);
//   const finish = parseDate(item.AdjustedFinishTime);

//   // default values
//   let started = false;
//   let IsNext = item.IsNext || false;
//   let isExpanded = !!item.IsNext;

//   // check if this game is currently started
//   if (now >= start && now <= finish + 10) {
//     console.log("Game started", item.EventId);
//     started = true;
//     IsNext = false;
//     isExpanded = false;

//     // make the NEXT item in the list the "next game"
//     const nextItem = arr[index + 1];
//     if (nextItem) {
//       arr[index + 1] = {
//         ...nextItem,
//         IsNext: true,
//         isExpanded: true,
//       };
//     }
//   }
//   if (now > finish) {
//     item.IsFinished = true;
//   }

//   return {
//     ...item,
//     started,
//     IsNext,
//     isExpanded,
//   };
//   // } else {
//   //   localInfo.value = props.info.data.Data;
//   // }
// });

// const localInfo = computed(() => {
//   const now = Date.now(); // or however you're calculating it
//   return (
//     props.info?.data?.Data?.map((item, index, arr) => {
//       const start = parseDate(item.AdjustedStartTime);
//       const finish = parseDate(item.AdjustedFinishTime);

//       let started = false;
//       let IsNext = item.IsNext || false;
//       let isExpanded = !!item.IsNext;

//       if (now >= start && now <= finish + 10) {
//         started = true;
//         IsNext = false;
//         isExpanded = false;

//         const nextItem = arr[index + 1];
//         if (nextItem) {
//           arr[index + 1] = {
//             ...nextItem,
//             IsNext: true,
//             isExpanded: true,
//           };
//         }
//       }

//       if (now > finish + 10) {
//         item.IsFinished = true;
//       }

//       return {
//         ...item,
//         started,
//         IsNext,
//         isExpanded,
//       };
//     }) ?? []
//   );
// });

// watch(
//   () => props.info, // what to watch
//   (newVal, oldVal) => {
//     console.log("---------", props.info);
//     console.log("---------", localInfo.value);
//   },
//   { deep: true }
// );

// console.log("localInfo (raw):", localInfo.value);

// localInfo.value.forEach((item) => {
//   if (item.IsNext) {
//     onStartLoadEventDetail(item.EventId, item.ID);
//   }
// });

// watch(
//   () => props.info?.data?.Data,
//   (newVal) => {
//     const now = Date.now();
//     let startedIndex = -1;
//     // console.log("Changing");
//     // First pass: detect started game
//     if (!newVal) return;

//     localInfo.value = newVal.map((item, index) => {
//       const start = parseDate(item.AdjustedStartTime);
//       const finish = parseDate(item.AdjustedFinishTime);

//       // now > start ? console.log("Greater") : console.log("Lesser");

//       if (now >= finish + 600) {
//         // console.log("Game started", item.EventId);
//         // startedIndex = index;
//         return {
//           ...item,
//           IsFinished: true,
//           IsNext: false,
//           isExpanded: false,
//         };
//       }

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

function passSelectedBet(
  id,
  type,
  name,
  odd,
  date,
  gameId,
  number,
  gameName,
  longId
) {
  // console.log("selected bet:", id)
  emit("winClicked", {
    id,
    betType: type,
    name: name,
    odd,
    date: date,
    gameId,
    stake: 10,
    number,
    stakeUpdated: false,
    gameName,
    longId,
  });
}

function onStartLoadEventDetail(id, i) {
  // console.log("III from basic", i);
  emit("getEventDetail", id, i);
}

function handleFinish(id, feed, name) {
  // emit("finished", id, feed, name);
  nextTick(() => {
    setTimeout(() => {
      analyzeData(props.info?.data?.Data);
    }, 1000);
  });
}

function handleToggle(id, i) {
  // console.log(id);
  emit("getEventDetail", id, i);
  // console.log("localInfo (raw):", props.eventDetail);
}
function passCombo(n, id) {
  emit("comboSelected", n, id);
}
function passClearCombo(id) {
  emit("clearComboBets", id);
}
function passCombos(
  type,
  eventId,
  Id,
  typeToSend,
  marketValue,
  eventValue,
  displayDesc,
  gameName,
  gameId
) {
  emit(
    "combo",
    type,
    eventId,
    Id,
    typeToSend,
    marketValue,
    eventValue,
    displayDesc,
    gameName,
    gameId
  );
}

onMounted(() => {
  document.addEventListener(
    "visibilitychange",
    analyzeData(props.info?.data?.Data)
  );
});
</script>
<template>
  <div
    v-for="(i, index) in localInfo"
    v-if="!isKeno && localInfo.length > 0"
    :key="i.id"
    class="flex flex-col gap-2"
  >
    <div
      :class="`race-row font-roboto h-12 w-full border-b border-gray-200 flex justify-between items-center gap-4 ${
        i.isExpanded
          ? 'bg-[#37B34A] text-white'
          : i.started && !i.isExpanded
          ? 'bg-[#B5280C] text-white'
          : 'bg-[#fcfcfc]'
      }`"
    >
      <div class="flex items-center gap-4">
        <div class="flex flex-col justify-center items-center gap-0">
          <Countdown
            v-if="i.IsNext"
            :timestamp="parseInt(i.AdjustedStartTime.match(/\d+/)[0])"
            @finished="handleFinish(i.EventId, i.FeedId, i.TypeName)"
          />
          <!-- <Countdown
            v-if="i.IsNext"
            :timestamp="timestamp"
            @finished="handleFinish(i.EventId, i.FeedId, i.TypeName)"
          /> -->
          <div
            v-if="i.started"
            class="bg-[#B5280C] text-white text-[.65em] w-full flex justify-center items-center font-bold tracking-widest rounded-tr-sm rounded-br-sm"
          >
            LIVE
          </div>
          <div>{{ i.StartTimeAsWords }}</div>
        </div>
        <div>
          <div class="flex gap-1 uppercase">
            <div>{{ i.Race.Name }}</div>
            <div>{{ i.Race.Distance }}</div>
          </div>
          <div>ID {{ i.Number }}</div>
        </div>
      </div>
      <div @click="i.isExpanded = !i.isExpanded">
        <Plus
          :color="i.isExpanded || i.started ? 'fcfcfc' : '37B34A'"
          :state="i.isExpanded"
          @click="
            if (!i.isExpanded) {
              handleToggle(i.EventId, i.ID);
            }
          "
        />
      </div>
    </div>

    <!-- Transition wrapper -->
    <transition name="expand">
      <!-- <SingleRaceGameDisplay
        v-if="i.isExpanded"
        :eventDetail="eventDetail[i.EventId].data"
      /> -->
      <SingleRaceGameDisplay
        @winClicked="passSelectedBet"
        @comboSelected="passCombo"
        @clearComboBets="passClearCombo"
        @combo="passCombos"
        :imageDir="imageDir"
        :comboSelections="comboSelections"
        v-if="i.isExpanded && eventDetail[i.EventId]"
        :eventDetail="eventDetail[i.EventId].data"
        :finished="i.IsFinished || i.started"
        :trackingSelectedNumbers="trackingSelectedNumbers"
        :placingBet="placingBet"
      />
    </transition>
  </div>
  <KenoUI v-if="isKeno" />
</template>

<style scoped>
/* ENTER (appearing animation from middle outward) */
.expand-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center center; /* expand from middle */
}
.expand-enter-from {
  opacity: 0;
  transform: scaleY(0);
}
.expand-enter-to {
  opacity: 1;
  transform: scaleY(1);
}

/* LEAVE (instantly disappear) */
.expand-leave-active {
  transition: none;
}
.expand-leave-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(1);
}
.race-row {
  transition: background-color 0.4s ease, color 0.4s ease;
}
</style>
