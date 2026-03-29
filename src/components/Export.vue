<template>
  <div
    class="text-xs border border-[#37b34a] px-2.5 py-1 rounded flex gap-1 items-center text-[#333] cursor-pointer hover:bg-[#F1FBF2]"
    @click="$emit('getBalanceData')"
  >
    <svg
      viewBox="0 0 512 512"
      width="15"
      height="15"
      class="fill-current text-[#37b34a]"
    >
      <path
        d="m288 304 64 112h-48l-48-84.5-31.5 52.5H256v32h-96l64-112-64-112h48l48 84 48-84h48zm64-272H96c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V128zm64 416H96V64h224v96h96z"
      ></path>
    </svg>
    Export To Excel
  </div>
</template>
