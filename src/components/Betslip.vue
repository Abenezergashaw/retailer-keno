<script setup>
import BetSlipIcon from "./BetSlipIcon.vue";
import GeneralStakeButton from "./GeneralStakeButton.vue";
import { ref, computed, watch } from "vue";

const props = defineProps({
  selectedBets: {
    type: Array,
  },
  expiredBets: {
    type: Array,
  },
  game: String,
  placingBet: Boolean,
  betPlacedSuccess: Boolean,
  limitReached: Boolean,
});

const emit = defineEmits();

const betSlipType = ref("single");
const stakeInputs = ref([]);

const betsWithToWin = computed(() =>
  props.selectedBets.map((bet) => {
    if (bet.betType === "keno") {
      return {
        ...bet,
        toWin: bet.maxOdd * bet.stake,
      };
    } else {
      return {
        ...bet,
        toWin: bet.odd * bet.stake,
      };
    }
  }),
);

watch(
  () => props.selectedBets, // what to watch
  (newVal, oldVal) => {
    activeBet.value = null;
  },
  { deep: true }, // needed if selectedBets is an array of objects
);

// console.log("Betwwithtowin,", betsWithToWin.value);

const generalStake = ref(10);

const activeBet = ref(null);

// const totals = computed(() => {
//   return props.selectedBets.reduce(
//     (acc, bet) => {
//       acc.totalStake += bet.stake;
//       acc.totalToWin += bet.odd * bet.stake;
//       return acc;
//     },
//     { totalStake: 0, totalToWin: 0 }
//   );
// });
// const totals = computed(() => {
//   return props.selectedBets.reduce(
//     (acc, bet) => {
//       acc.totalStake += bet.stake;

//       if (bet.isCombo && bet.data?.Permutations?.length === 1) {
//         // use MinOdds (or MaxOdds, same here)
//         acc.totalToWin += bet.data.MinOdds * bet.stake;
//       } else {
//         // normal bet
//         acc.totalToWin += bet.odd * bet.stake;
//       }

//       return acc;
//     },
//     { totalStake: 0, totalToWin: 0 }
//   );
// });

const totals = computed(() => {
  return props.selectedBets.reduce(
    (acc, bet) => {
      acc.totalStake += bet.stake;

      if (bet.isCombo && bet.data?.Permutations?.length) {
        const comboLength = bet.data.Permutations.length;
        if (comboLength === 1) {
          acc.totalToWin += bet.stake * bet.data.MinOdds;
        } else {
          acc.totalToWin += (bet.stake * bet.data.MaxOdds) / comboLength;
        }
      } else if (bet.betType === "keno") {
        acc.totalToWin += bet.maxOdd * bet.stake;
      } else {
        // Normal bet
        acc.totalToWin += bet.odd * bet.stake;
      }

      return acc;
    },
    { totalStake: 0, totalToWin: 0 },
  );
});

const stakeButtons = ref([
  {
    bg: "bg-[#C9580F]",
    stake: 10,
  },
  {
    bg: "bg-[#C93362]",
    stake: 20,
  },
  {
    bg: "bg-[#8830AD]",
    stake: 50,
  },
  {
    bg: "bg-[#5A95F0]",
    stake: 100,
  },
  {
    bg: "bg-[#688A37]",
    stake: 150,
  },
]);

function toggleSelect(event) {
  const input = event.target;
  if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
    // Already selected → unselect by moving cursor to end
    input.setSelectionRange(input.value.length, input.value.length);
  } else {
    // Not selected → select all
    input.select();
  }
}

function handleMinus(index) {
  emit("singleBetMinus", index);
  const input = stakeInputs.value[index];
  if (input) {
    setTimeout(() => {
      input.select();
    }, 50);
  }
}

function handlePlus(index) {
  emit("singleBetPlus", index);
  const input = stakeInputs.value[index];
  if (input) {
    setTimeout(() => {
      input.select();
    }, 50);
  }
}

function handleInput(event, index) {
  const value = Number(event.target.value);
  emit("stakeChange", index, value);
}

function handleGeneralInput(event, index) {
  const value = Number(event.target.value);
  emit("generalStakeButtonPlus", value);
}

function handleGeneralBlur() {
  if (generalStake.value < 10) {
    generalStake.value = 10;
    emit("generalStakeButtonPlus", 10);
  }
}

function handleBlur(index) {
  const bet = betsWithToWin.value[index];

  if (!bet.stake || bet.stake < 10) {
    emit("stakeChange", index, 10);
  }
}

function handleSingleStakeButtons(value, index) {
  emit("singleStakeButtons", value, index);
  const input = stakeInputs.value[index];
  if (input) {
    setTimeout(() => {
      input.select();
    }, 50);
  }
}
</script>

<template>
  <div
    class="text-[#37b34a] bg-[#fcfcfc] border-b-[#fcfcfc] border-x-transparent shadow-[0_2px_10px_#e2e2e2] text-center font-roboto text-[1em] font-light py-1.5"
  >
    Betslip
  </div>

  <div class="bg-white shadow-lg shadow-gray-200 font-roboto">
    <div v-if="expiredBets.length > 0" class="w-full rounded">
      <div
        class="bg-[#E4595B] text-white font-semibold py-1 rounded-t flex justify-between items-center"
      >
        <div class="text-lg">Expired Bets</div>
        <div @click="$emit('clearExpiredBets')">
          <img
            src="../assets/images/Archive.svg"
            class="w-9 cursor-pointer opacity-70 hover:opacity-100"
            alt=""
          />
        </div>
      </div>
      <div
        v-for="e in expiredBets"
        class="bg-[#C62828] w-full relative rounded py-1 mb-0.5"
      >
        <!-- Left Icon -->
        <BetSlipIcon :game="game" />

        <div class="ml-9 text-white flex flex-col gap-0.5 leading-none text-xs">
          <div class="m-0 p-0">
            {{ e.betType }}
          </div>
          <div class="m-0 p-0">
            {{ e.name }}
          </div>
          <div class="m-0 p-0">{{ e.date }} ID{{ e.gameId }}</div>
        </div>
      </div>
    </div>

    <div class="w-full mt-1 mb-3">
      <ul
        class="flex justify-center items-center border-[1.5px] border-[#37b34a] w-[70%] mx-auto rounded uppercase text-sm text-[#8C8C8C] h-[18px] overflow-hidden font-roboto"
      >
        <!-- Single Tab -->
        <li
          class="flex-1 h-full flex items-center justify-center cursor-pointer font-normal text-xs"
          :class="betSlipType === 'single' ? 'bg-[#37b34a] text-[#fcfcfc]' : ''"
          @click="betSlipType = 'single'"
        >
          <h2>Single</h2>
        </li>

        <!-- Multiples Tab -->
        <li
          class="flex-1 h-full flex items-center justify-center cursor-pointer font-normal text-xs"
          :class="
            betSlipType === 'multiple' ? 'bg-[#37b34a] text-[#fcfcfc]' : ''
          "
          @click="betSlipType = 'multiple'"
        >
          <h2>Multiples</h2>
        </li>
      </ul>
    </div>

    <div
      v-if="betsWithToWin.length === 0 && !betPlacedSuccess && !limitReached"
      class="text-[#8c8c8c] text-sm text-center my-2 font-roboto"
    >
      Add more bets
    </div>

    <div
      v-if="betPlacedSuccess && betsWithToWin.length === 0"
      class="text-[#efefef] rounded py-0.5 text-[15px] text-center my-0 w-[95%] mx-auto"
      style="
        animation:
          scaleIn 0.4s ease-out forwards,
          pulseColors 1.5s ease-in-out infinite;
      "
    >
      Bet successfully placed!
    </div>

    <div
      v-if="limitReached && betsWithToWin.length === 0"
      class="text-[#efefef] rounded py-0.5 text-[15px] text-center my-0 w-[95%] mx-auto mt-1 px-2"
      style="
        animation:
          scaleIn 0.4s ease-out forwards,
          pulseColors2 1.5s ease-in-out infinite;
      "
    >
      WARNING, you are approaching your ‘cash balance limit’ and will be blocked
      from selling, cancelling or redeeming bets when your limit is reached.
      Please notify your Supervisor or Manager.
    </div>

    <!-- Bet slip  -->
    <div class="max-h-[70vh] overflow-auto mt-1.5">
      <div v-for="(bet, index) in betsWithToWin" :key="bet.gameId">
        <transition name="slide-left" appear>
          <div
            @click="betsWithToWin.length > 1 ? (activeBet = index) : ''"
            v-if="
              !bet.isCombo &&
              bet.betType !== 'keno' &&
              bet.betType !== 'Heads' &&
              bet.betType !== 'Tails' &&
              bet.betType !== 'Evens'
            "
            class="bg-[#8c8c8c] text-white pb-1 px-2 rounded relative w-full mb-0.5"
          >
            <!-- Remove Button (X) -->
            <button
              @click="
                if (!placingBet) {
                  $emit('removeSelectedBet', bet);
                  activeBet = null;
                }
              "
              class="absolute top-1.5 right-1.5 fill-[#bfbfbf] text-[#636363] hover:fill-[#a6a6a6] hover:text-[#494949] transition-transform duration-300 ease-in-out hover:rotate-90"
            >
              <!-- Example with an inline SVG -->
              <svg
                class="w-4 h-4"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="2"
                  y1="2"
                  x2="14"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
                <line
                  x1="14"
                  y1="2"
                  x2="2"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
              </svg>
            </button>

            <!-- Left Icon -->
            <BetSlipIcon :game="bet.gameName" />

            <!-- Right Section -->
            <div class="ml-8 flex flex-col gap-[2px]">
              <!-- gap = only 2px -->

              <h3 class="text-[11px] font-base leading-none m-0">
                {{ bet.betType }}
              </h3>

              <!-- Name + Odd -->
              <div class="flex items-center gap-1 leading-none font-base">
                <span class="text-[11px] leading-none">{{ bet.name }}</span>
                <span
                  class="font-medium bg-[#257832] border border-[#37B34A] px-1 py-[1px] text-[10px] leading-none rounded-sm text-white"
                >
                  {{ bet.odd }}
                </span>
              </div>

              <!-- Date & ID -->
              <div class="leading-none flex items-center text-[11px]">
                <span class="font-bold">{{ bet.date }}</span>
                <span class="ml-1">ID{{ bet.gameId }}</span>
              </div>
            </div>
            <!-- Stake Controls -->
            <div
              class="flex items-center justify-between bg-white rounded text-black overflow-hidden h-6 w-[80%] ml-8 mt-1"
            >
              <button
                @click="handleMinus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 16 3"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="16" height="5" fill="currentColor" />
                </svg>
              </button>
              <input
                type="number"
                v-model="bet.stake"
                :ref="(el) => (stakeInputs[index] = el)"
                @click="
                  toggleSelect($event);
                  betsWithToWin.length > 1 ? (activeBet = index) : '';
                "
                @blur="handleBlur(index)"
                @input="handleInput($event, index)"
                class="w-full h-full text-right px-2 text-[14px] font-base outline-none leading-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                :class="`${bet.stake < 10 ? 'bg-[#C62828] text-white' : ''}`"
              />

              <button
                @click="handlePlus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="4.5"
                    width="12"
                    height="3"
                    fill="currentColor"
                  />
                  <rect
                    x="4.5"
                    y="0"
                    width="3"
                    height="12"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div
              v-if="betsWithToWin.length > 1 && activeBet === index"
              class="flex justify-center items-center mt-1 gap-1 mx-auto w-full"
            >
              <GeneralStakeButton
                v-for="s in stakeButtons"
                :bg="s.bg"
                :stake="s.stake"
                @click="handleSingleStakeButtons(s.stake, index)"
              />
            </div>

            <!-- To Win -->
            <div
              class="text-right text-[11px] leading-none w-[80%] ml-8 mt-1.5"
            >
              To Win:
              <span class="font-bold"
                >Br {{ Number(bet.toWin).toFixed(2) }}
              </span>
            </div>
          </div>
        </transition>

        <!-- Keno  -->
        <transition name="slide-left" appear>
          <div
            @click="betsWithToWin.length > 1 ? (activeBet = index) : ''"
            v-if="
              !bet.isCombo &&
              (bet.betType === 'keno' ||
                bet.betType === 'Heads' ||
                bet.betType === 'Tails' ||
                bet.betType === 'Evens')
            "
            class="bg-[#8c8c8c] text-white pb-1 px-2 rounded relative w-full mb-0.5"
          >
            <!-- Remove Button (X) -->
            <button
              @click="
                if (!placingBet) {
                  $emit('removeSelectedBet', bet);
                  activeBet = null;
                }
              "
              class="absolute top-1.5 right-1.5 fill-[#bfbfbf] text-[#636363] hover:fill-[#a6a6a6] hover:text-[#494949] transition-transform duration-300 ease-in-out hover:rotate-90"
            >
              <!-- Example with an inline SVG -->
              <svg
                class="w-4 h-4"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="2"
                  y1="2"
                  x2="14"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
                <line
                  x1="14"
                  y1="2"
                  x2="2"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
              </svg>
            </button>

            <!-- Left Icon -->
            <BetSlipIcon :game="bet.gameName" />

            <!-- Right Section -->
            <div class="ml-8 flex flex-col gap-[2px]">
              <!-- gap = only 2px -->

              <h3 class="text-[11px] font-base leading-none m-0">
                {{ bet.displayName }}
              </h3>

              <!-- Name + Odd -->
              <div class="flex items-center gap-1 leading-none font-base">
                <span class="text-[11px] leading-none tracking-wider">{{
                  bet.betType === "keno" ? bet.selectedNumbers : bet.betType
                }}</span>
                <span
                  class="font-medium bg-[#257832] border border-[#37B34A] px-1 py-[1px] text-[10px] leading-none rounded-sm text-white"
                >
                  {{ bet.maxOdd }}
                </span>
              </div>

              <!-- Date & ID -->
              <div class="leading-none flex items-center text-[11px]">
                <span class="font-bold">{{ bet.date }}</span>
                <span class="ml-1">ID{{ bet.gameId }}</span>
              </div>
            </div>
            <!-- Stake Controls -->
            <div
              class="flex items-center justify-between bg-white rounded text-black overflow-hidden h-6 w-[80%] ml-8 mt-1"
            >
              <button
                @click="handleMinus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 16 3"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="16" height="5" fill="currentColor" />
                </svg>
              </button>
              <input
                type="number"
                v-model="bet.stake"
                :ref="(el) => (stakeInputs[index] = el)"
                @click="
                  toggleSelect($event);
                  betsWithToWin.length > 1 ? (activeBet = index) : '';
                "
                @blur="handleBlur(index)"
                @input="handleInput($event, index)"
                class="w-full h-full text-right px-2 text-[14px] font-base outline-none leading-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                :class="`${bet.stake < 10 ? 'bg-[#C62828] text-white' : ''}`"
              />

              <button
                @click="handlePlus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="4.5"
                    width="12"
                    height="3"
                    fill="currentColor"
                  />
                  <rect
                    x="4.5"
                    y="0"
                    width="3"
                    height="12"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div
              v-if="betsWithToWin.length > 1 && activeBet === index"
              class="flex justify-center items-center mt-1 gap-1 mx-auto w-full"
            >
              <GeneralStakeButton
                v-for="s in stakeButtons"
                :bg="s.bg"
                :stake="s.stake"
                @click="handleSingleStakeButtons(s.stake, index)"
              />
            </div>

            <!-- To Win -->
            <div
              class="text-right text-[11px] leading-none w-[80%] ml-8 mt-1.5"
            >
              To Win:
              <span class="font-bold"
                >Br {{ Number(bet.toWin).toFixed(2) }}
              </span>
            </div>
          </div>
        </transition>

        <transition name="slide-left" appear>
          <div
            v-if="bet.isCombo"
            class="bg-[#8c8c8c] text-white pb-1.5 px-2 rounded relative w-full mb-0.5"
          >
            <!-- Remove Button (X) -->
            <button
              @click="
                if (!placingBet) {
                  $emit('removeSelectedBet', bet);
                  activeBet = null;
                }
              "
              class="absolute top-1.5 right-1.5 fill-[#bfbfbf] text-[#636363] hover:fill-[#a6a6a6] hover:text-[#494949] transition-transform duration-300 ease-in-out hover:rotate-90"
            >
              <!-- Example with an inline SVG -->
              <svg
                class="w-4 h-4"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="2"
                  y1="2"
                  x2="14"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
                <line
                  x1="14"
                  y1="2"
                  x2="2"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="5"
                />
              </svg>
            </button>

            <!-- Left Icon -->
            <BetSlipIcon :game="game" />
            <!-- Right Section -->
            <div class="ml-8 flex flex-col gap-[2px]">
              <!-- gap = only 2px -->

              <h3 class="text-[11px] font-base leading-none m-0">
                {{ bet.betType }} ({{ bet.data.Permutations.length }} Combo)
              </h3>

              <!-- Name + Odd -->
              <div class="flex items-center gap-1 leading-none font-base">
                <span class="text-[11px] leading-none">{{
                  bet.data.MinNotation
                }}</span>
              </div>

              <!-- Date & ID -->
              <div class="leading-none flex items-center text-[11px]">
                <span class="font-bold">{{ bet.date }}</span>
                <span class="ml-1">ID{{ bet.gameId }}</span>
              </div>
            </div>

            <div class="flex gap-0.5 my-0.5">
              <span class="text-[11px] leading-none">{{
                bet.data.MinNotation
              }}</span>
              <span
                class="font-medium bg-[#257832] border border-[#37B34A] px-1 py-[1px] text-[10px] leading-none rounded-sm text-white"
              >
                {{ bet.data.MinOdds }} (Min)
              </span>
              <span class="text-[11px] leading-none">{{
                bet.data.MaxNotation
              }}</span>
              <span
                class="font-medium bg-[#257832] border border-[#37B34A] px-1 py-[1px] text-[10px] leading-none rounded-sm text-white"
              >
                {{ bet.data.MaxOdds }} (Max)
              </span>
            </div>

            <!-- Stake Controls -->
            <div
              class="flex items-center justify-between bg-white rounded text-black overflow-hidden h-6 w-[80%] ml-8 mt-1"
            >
              <button
                @click="handleMinus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 16 3"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="16" height="5" fill="currentColor" />
                </svg>
              </button>
              <input
                type="number"
                v-model="bet.stake"
                :ref="(el) => (stakeInputs[index] = el)"
                @click="
                  toggleSelect($event);
                  activeBet = index;
                "
                @blur="handleBlur(index)"
                @input="handleInput($event, index)"
                class="w-full h-full text-right px-2 text-[14px] font-base outline-none leading-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                :class="`${bet.stake < 10 ? 'bg-[#C62828] text-white' : ''}`"
              />

              <button
                @click="handlePlus(index)"
                class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  class="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="4.5"
                    width="12"
                    height="3"
                    fill="currentColor"
                  />
                  <rect
                    x="4.5"
                    y="0"
                    width="3"
                    height="12"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div
              v-if="betsWithToWin.length > 1 && activeBet === index"
              class="flex justify-center items-center mt-1 gap-1 mx-auto w-full"
            >
              <GeneralStakeButton
                v-for="s in stakeButtons"
                :bg="s.bg"
                :stake="s.stake"
                @click="handleSingleStakeButtons(s.stake, index)"
              />
            </div>

            <!-- To Win -->
            <!-- <div
              class="text-right text-[11px] leading-none w-[80%] ml-8 mt-1.5"
            >
              To Win:
              <span class="font-bold"
                >Br {{ Number(bet.toWin).toFixed(2) }}
              </span>
            </div> -->
          </div>
        </transition>
      </div>
    </div>

    <!-- Stake buttons  -->
    <div
      v-if="betsWithToWin.length > 0"
      class="flex justify-center items-center mt-1 gap-1"
    >
      <GeneralStakeButton
        v-for="s in stakeButtons"
        :bg="s.bg"
        :stake="s.stake"
        @click="$emit('generalStakeButtonClicked', s.stake)"
      />
    </div>

    <!-- Bet infos  -->
    <div class="px-0 w-full text-[#939393] relative">
      <!-- Stake -->
      <div v-if="betsWithToWin.length > 1">
        <div class="text-sm font-semibold ml-8">STAKE</div>
        <div class="flex items-center mb-1">
          <div
            class="flex items-center justify-between bg-white rounded text-black overflow-hidden h-6 w-[75%] ml-8"
          >
            <button
              @click="
                if (generalStake > 10) {
                  generalStake = generalStake - 10;
                }
                $emit('generalStakeButtonMinus', generalStake);
              "
              class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
            >
              <svg
                width="12"
                height="8"
                viewBox="0 0 16 3"
                class="fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="16" height="5" fill="currentColor" />
              </svg>
            </button>
            <input
              type="number"
              v-model="generalStake"
              @click="toggleSelect($event)"
              @blur="handleGeneralBlur(index)"
              @input="handleGeneralInput($event, index)"
              class="w-full h-full text-right px-2 text-[14px] border border-[#BCBCBC] font-base outline-none leading-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
            />

            <button
              @click="
                generalStake = generalStake + 10;
                $emit('generalStakeButtonPlus', generalStake);
              "
              class="px-1.5 h-full flex items-center justify-center bg-[#bcbcbc] hover:bg-[#d5d5d5] hover:[box-shadow:inset_0_0_10px_rgba(0,0,0,0.2),0_0_0_rgba(0,0,0,0.9)] text-white"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                class="fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="0" y="4.5" width="12" height="3" fill="currentColor" />
                <rect x="4.5" y="0" width="3" height="12" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div
        v-if="betsWithToWin.length > 0"
        class="flex justify-between text-base mt-1 px-3"
      >
        <span class="uppercase">Total Stake</span>
        <span class="font-semibold">Br {{ totals.totalStake.toFixed(2) }}</span>
      </div>
      <div
        v-if="betsWithToWin.length > 0"
        class="flex justify-between text-base font-bold uppercase text-[#939393] px-3"
      >
        <span>Total "To Win"</span>
        <span>Br {{ totals.totalToWin.toFixed(2) }}</span>
      </div>
      <div class="flex items-center justify-between font-normal tracking-wider">
        <div
          class="absolute left-32 z-10"
          :class="`${betsWithToWin.length === 1 ? 'top-2' : 'top-12'}`"
          v-if="placingBet"
        >
          <div
            class="w-12 h-12 rounded-full border-[6px] animate-spin"
            style="border-color: #37b34a; border-top-color: #a1e2ab"
          ></div>
        </div>

        <div class="w-1/4 relative">
          <button
            @click="
              $emit('handleClearBets');
              activeBet = null;
              generalStake = 10;
            "
            :disabled="betsWithToWin.length === 0 || placingBet"
            class="w-full h-[50px] py-2 text-sm font-base border border-gray-300 text-white bg-[#FB827F] uppercase cursor-pointer disabled:cursor-default disabled:opacity-50 enabled:hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_0_0_black] enabled:hover:bg-[#FB827F] enabled:hover:text-white"
          >
            Clear
          </button>
        </div>
        <div class="w-3/4 relative">
          <button
            @click="$emit('placeBet')"
            :disabled="betsWithToWin.length === 0 || placingBet"
            class="w-full py-2 text-[15px] font-base text-white bg-[#37b34a] uppercase h-[50px] disabled:opacity-50 disabled:text-white disabled:cursor-default enabled:hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_0_0_black] enabled:hover:text-white border border-white"
          >
            Place Bet
            <span
              class="ml-2 font-base py-1 px-4 rounded"
              :class="`${betsWithToWin.length === 0 ? '' : 'bg-[#0AC419]'}`"
            >
              Br.
              {{
                betsWithToWin.length === 0 ? 10 : totals.totalStake.toFixed(2)
              }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="w-full relative"></div>
  </div>
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.slide-left-enter-from {
  transform: translateX(-50%) scale(0.1);
  opacity: 0;
}
.slide-left-enter-to {
  transform: translateX(0) scale(1);
  opacity: 1;
}

.slide-left-leave-from {
  transform: translateX(0) scale(1);
  opacity: 1;
}
.slide-left-leave-to {
  transform: translateX(-20%) scale(0.5);
  opacity: 0;
}
@keyframes pulseColors {
  0%,
  100% {
    background-color: #599031;
  }
  50% {
    background-color: #80b845;
  }
}

@keyframes pulseColors2 {
  0%,
  100% {
    background-color: #b96e00;
  }
  50% {
    background-color: #e38800;
  }
}
@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  80% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
