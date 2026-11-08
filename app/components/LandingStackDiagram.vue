<script setup lang="ts">
const rows = [
  {
    side: 'USER',
    label: 'Applications',
    note: 'consumer / producer',
    highlight: false
  },
  {
    side: 'KERNEL',
    label: 'Socket-compatible API',
    note: 'socket-like',
    highlight: false
  },
  {
    side: 'KERNEL',
    label: 'Name resolution',
    note: 'forwarding + demux',
    highlight: true
  },
  {
    side: 'KERNEL',
    label: 'PIT · CS · FIB',
    note: 'per-packet state',
    highlight: true
  },
  {
    side: 'KERNEL',
    label: 'Two-layer faces',
    note: 'MAC / IP / port',
    highlight: true
  },
  {
    side: 'LINK',
    label: 'NIC & network',
    note: 'address-based devices',
    highlight: false
  }
]
</script>

<template>
  <div
    class="relative overflow-hidden border border-white/15 bg-[#0d0d0d] text-white"
    aria-label="iStack data plane layers"
  >
    <div
      class="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6"
    >
      <span class="nip-kicker text-white/40">iStack / data plane</span>
      <span class="font-mono text-[10px] tracking-[0.16em] text-[#fd7800]">
        NSDI '24
      </span>
    </div>

    <div class="relative p-4 sm:p-6">
      <div
        class="absolute bottom-20 left-[4.4rem] top-6 hidden w-px bg-gradient-to-b from-transparent via-[#fd7800]/60 to-transparent sm:block"
      />

      <ul class="space-y-2">
        <li
          v-for="(row, index) in rows"
          :key="row.label"
          class="grid grid-cols-[2.2rem_1fr] items-stretch gap-3 sm:grid-cols-[4.1rem_1fr]"
        >
          <span
            class="pt-3 font-mono text-[8px] uppercase leading-none tracking-[0.14em] text-white/30"
          >
            {{ row.side }}
          </span>

          <div
            class="relative flex items-center justify-between gap-3 border px-3 py-2.5"
            :class="
              row.highlight
                ? 'border-[#fd7800]/60 bg-[#fd7800]/10'
                : 'border-white/10 bg-white/[0.025]'
            "
          >
            <div class="flex items-center gap-3">
              <span class="font-mono text-[9px] text-white/25">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="text-[13px] font-medium text-white sm:text-sm">
                {{ row.label }}
              </span>
            </div>
            <span
              class="hidden font-mono text-[8px] uppercase tracking-[0.12em] text-white/30 sm:block"
            >
              {{ row.note }}
            </span>
            <span
              v-if="row.highlight"
              class="absolute -left-px top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[#fd7800]"
            />
          </div>
        </li>
      </ul>

      <div
        class="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[0.12em]"
      >
        <span class="bg-[#fd7800] px-2 py-1 text-black">Interest</span>
        <span class="text-white/25">→</span>
        <span class="border border-white/15 px-2 py-1 text-white/50">PIT</span>
        <span class="text-white/25">→</span>
        <span class="border border-white/15 px-2 py-1 text-white/50">FIB</span>
        <span class="text-white/25">→</span>
        <span class="border border-white/15 px-2 py-1 text-white/50">Face</span>
        <span class="ml-auto text-white/30">Data ← CS</span>
      </div>
    </div>
  </div>
</template>
