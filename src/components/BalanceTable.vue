<script setup>
import { ref, computed } from "vue";
import PrintIcon from "./PrintIcon.vue";
const props = defineProps({
  balanceData: Array,
  balanceDataLoader: Boolean,
});
import { useAuthStore } from "@/store/auth";

const auth = useAuthStore();

const totals = computed(() =>
  Object.values(
    (props.balanceData ?? []).reduce((acc, item) => {
      const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          bets: 0,
          cancellations: 0,
          redeemed: 0,
        };
      }
      acc[dateKey].bets += item.stake;
      if (item.isCancelled === 1) acc[dateKey].cancellations += item.stake;
      if (item.isRedeemed === 1)
        acc[dateKey].redeemed += item.stake * Number(item.odd);
      return acc;
    }, {})
  )
);

const selectedData = ref(null);
</script>

<template>
  <div class="overflow-x-auto text-sm mt-6">
    <table
      id="reportTable"
      class="min-w-full border border-gray-100 divide-y text-xs table-fixed"
    >
      <thead class="">
        <tr>
          <th class="px-4 py-2 text-left font-medium truncate"></th>
          <th class="px-4 py-2 text-left font-medium truncate">Retail User</th>
          <th class="px-4 py-2 text-left font-medium truncate">From Date</th>
          <th class="px-4 py-2 text-left font-medium truncate">To Date</th>
          <th class="px-4 py-2 text-left font-medium truncate">
            Start Balance
          </th>
          <th class="px-4 py-2 text-left font-medium truncate">Deposits</th>
          <th class="px-4 py-2 text-left font-medium truncate">Bets</th>
          <th class="px-4 py-2 text-left font-medium truncate">
            Cancellations
          </th>
          <th class="px-4 py-2 text-left font-medium truncate">Redeemed</th>
          <th class="px-4 py-2 text-left font-medium truncate">Withdraws</th>
          <th class="px-4 py-2 text-left font-medium truncate">End Balance</th>
          <th
            class="px-4 py-2 text-left font-medium truncate"
            v-if="auth?.user.createdBy == 'andualem'"
          >
            Unclaimed Winnings
          </th>
          <!-- <th class="px-4 py-2 text-left font-medium text-gray-700">
            Commission
          </th> -->
        </tr>
      </thead>
      <div
        v-if="balanceDataLoader"
        class="w-full absolute flex items-center justify-center bg-opacity-20"
      >
        <img src="../assets/images/loading-image.gif" alt="Loading..." />
      </div>
      <tbody class="divide-y divide-gray-200">
        <tr
          v-if="balanceData.length > 0 && !balanceDataLoader"
          v-for="(data, index) in [...balanceData].reverse()"
          @click="selectedData = index"
          :class="`${index % 2 !== 0 ? 'bg-gray-100' : ''}, ${
            selectedData === index
              ? 'bg-[#37b34a] text-white'
              : 'hover:bg-[#c1b8b4]'
          }`"
        >
          <td class="px-4 py-2 truncate">
            <PrintIcon @click="$emit('printZReport', data.date)" />
          </td>
          <td class="px-4 py-2 truncate">
            {{ auth?.user?.user }}.{{ auth?.user?.cashier }}
          </td>
          <td class="px-4 py-2 truncate">{{ data.date }} 00:00:00</td>
          <td class="px-4 py-2 truncate">{{ data.date }} 23:59:59</td>
          <td class="px-4 py-2 text-left truncate">Br 0.00</td>
          <td class="px-4 py-2 text-left truncate">
            Br. {{ data.bets.toFixed(2) }}
          </td>
          <td class="px-4 py-2 text-left truncate">
            Br. {{ data.bets.toFixed(2) }}
          </td>
          <td class="px-4 py-2 text-left truncate">
            Br. {{ data.cancellations.toFixed(2) }}
          </td>
          <td class="px-4 py-2 text-left truncate">
            Br. {{ data.redeemed.toFixed(2) }}
          </td>
          <td class="px-4 py-2 text-left truncate">Br. 0.00</td>
          <td class="px-4 py-2 text-left truncate">
            Br.
            {{ (data.bets - data.cancellations - data.redeemed).toFixed(2) }}
          </td>
          <td
            class="px-4 py-2 text-left truncate"
            v-if="auth?.user.createdBy == 'andualem'"
          >
            Br. {{ data.unclaimed.toFixed(2) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
