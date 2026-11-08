<script setup lang="ts">
type Variant = 'kernel' | 'names' | 'faces' | 'numbers'

const props = defineProps<{ variant: Variant }>()

const meta = computed(
  () =>
    ({
      kernel: { code: 'STACK / 01', label: 'iStack kernel layers' },
      names: { code: 'NRS / 02', label: 'Name resolution trie' },
      faces: { code: 'FACES / 03', label: 'Two-layer face abstraction' },
      numbers: { code: 'EVAL / 04', label: 'Evaluation results' }
    })[props.variant]
)
</script>

<template>
  <div
    class="relative aspect-[16/10] overflow-hidden border border-black/10 bg-[#f4f1ec] dark:border-white/15 dark:bg-neutral-900"
  >
    <div class="nip-grid pointer-events-none absolute inset-0 opacity-50" />

    <svg
      viewBox="0 0 320 200"
      class="relative h-full w-full text-black dark:text-white"
      fill="none"
      role="img"
      :aria-label="meta.label"
    >
      <g v-if="variant === 'kernel'" class="font-mono" font-size="7">
        <text
          x="28"
          y="17"
          fill="currentColor"
          opacity=".42"
          letter-spacing="1"
        >
          USER
        </text>
        <text
          x="292"
          y="17"
          fill="#fd7800"
          text-anchor="end"
          letter-spacing="1"
        >
          KERNEL / iStack
        </text>

        <g v-for="(row, index) in [
          { label: 'APPLICATIONS', note: 'consumer / producer', highlight: false },
          { label: 'SOCKET API', note: 'socket-like', highlight: false },
          { label: 'NAME RESOLUTION', note: 'forwarding + demux', highlight: true },
          { label: 'FACES', note: 'MAC / IP / port', highlight: true },
          { label: 'NIC', note: 'address-based', highlight: false }
        ]" :key="row.label">
          <rect
            x="28"
            :y="26 + index * 32"
            width="264"
            height="26"
            :fill="row.highlight ? '#fd7800' : 'transparent'"
            :fill-opacity="row.highlight ? 0.1 : 0"
            :stroke="row.highlight ? '#fd7800' : 'currentColor'"
            :stroke-opacity="row.highlight ? 0.65 : 0.22"
          />
          <rect
            v-if="row.highlight"
            x="28"
            :y="26 + index * 32"
            width="3"
            height="26"
            fill="#fd7800"
          />
          <text
            x="40"
            :y="42 + index * 32"
            fill="currentColor"
            font-size="7"
            font-weight="700"
            letter-spacing=".8"
          >
            {{ row.label }}
          </text>
          <text
            x="280"
            :y="42 + index * 32"
            fill="currentColor"
            opacity=".4"
            text-anchor="end"
            font-size="6.5"
          >
            {{ row.note }}
          </text>
        </g>
        <path
          d="M16 58V148"
          stroke="#fd7800"
          stroke-width="1.5"
          stroke-dasharray="3 5"
        />
        <circle cx="16" cy="58" r="2.5" fill="#fd7800" />
        <circle cx="16" cy="148" r="2.5" fill="#fd7800" />
      </g>

      <g v-else-if="variant === 'names'" class="font-mono" font-size="6.5">
        <text
          x="18"
          y="17"
          fill="currentColor"
          opacity=".42"
          letter-spacing="1"
        >
          PREFIX LOOKUP
        </text>
        <text
          x="302"
          y="17"
          fill="#fd7800"
          text-anchor="end"
          letter-spacing="1"
        >
          LONGEST MATCH
        </text>

        <path
          d="M62 100H74V66H86M62 100H74V134H86"
          stroke="currentColor"
          stroke-opacity=".3"
        />
        <path
          d="M138 66H150V40H168M138 66H150V82H168M138 134H150V132H168"
          stroke="currentColor"
          stroke-opacity=".3"
        />
        <path
          d="M62 100H74V66H86M138 66H150V40H168"
          stroke="#fd7800"
          stroke-width="1.5"
        />

        <g>
          <rect
            x="18"
            y="86"
            width="44"
            height="28"
            fill="#fd7800"
            fill-opacity=".1"
            stroke="#fd7800"
          />
          <text
            x="40"
            y="104"
            fill="currentColor"
            font-size="12"
            font-weight="700"
            text-anchor="middle"
          >
            /
          </text>
        </g>

        <g>
          <rect
            x="86"
            y="52"
            width="52"
            height="28"
            fill="#fd7800"
            fill-opacity=".1"
            stroke="#fd7800"
          />
          <text x="98" y="70" fill="currentColor" font-weight="700">/nip</text>

          <rect
            x="86"
            y="120"
            width="52"
            height="28"
            stroke="currentColor"
            stroke-opacity=".3"
          />
          <text x="98" y="138" fill="currentColor" opacity=".6">/docs</text>
        </g>

        <g>
          <rect
            x="168"
            y="26"
            width="80"
            height="28"
            fill="#fd7800"
            fill-opacity=".1"
            stroke="#fd7800"
          />
          <text x="178" y="44" fill="currentColor" font-weight="700">
            /nip/istack
          </text>

          <rect
            x="168"
            y="68"
            width="80"
            height="28"
            stroke="currentColor"
            stroke-opacity=".2"
          />
          <text x="178" y="86" fill="currentColor" opacity=".45">
            /nip/notes
          </text>

          <rect
            x="168"
            y="118"
            width="104"
            height="28"
            stroke="currentColor"
            stroke-opacity=".2"
          />
          <text x="178" y="136" fill="currentColor" opacity=".45">
            /docs/architecture
          </text>
        </g>

        <circle cx="62" cy="100" r="2.5" fill="#fd7800" />
        <circle cx="138" cy="66" r="2.5" fill="#fd7800" />
        <circle cx="168" cy="40" r="2.5" fill="#fd7800" />
        <text
          x="18"
          y="188"
          fill="currentColor"
          opacity=".35"
          font-size="6"
          letter-spacing=".8"
        >
          NAME /nip/istack/docs
        </text>
      </g>

      <g v-else-if="variant === 'faces'" class="font-mono" font-size="6.5">
        <text
          x="18"
          y="17"
          fill="currentColor"
          opacity=".42"
          letter-spacing="1"
        >
          ADDRESS SPACE
        </text>
        <text
          x="302"
          y="17"
          fill="#fd7800"
          text-anchor="end"
          letter-spacing="1"
        >
          NAME SPACE
        </text>

        <path
          d="M82 58H112V94H130M82 96H130M82 134H112V94H130"
          stroke="currentColor"
          stroke-opacity=".3"
        />
        <path
          d="M210 94H238V104H254"
          stroke="#fd7800"
          stroke-width="1.5"
        />

        <g>
          <rect
            x="18"
            y="44"
            width="64"
            height="28"
            stroke="currentColor"
            stroke-opacity=".3"
          />
          <text x="30" y="62" fill="currentColor" opacity=".55">MAC</text>

          <rect
            x="18"
            y="82"
            width="64"
            height="28"
            stroke="currentColor"
            stroke-opacity=".3"
          />
          <text x="30" y="100" fill="currentColor" opacity=".55">IP</text>

          <rect
            x="18"
            y="120"
            width="64"
            height="28"
            stroke="currentColor"
            stroke-opacity=".3"
          />
          <text x="30" y="138" fill="currentColor" opacity=".55">PORT</text>
        </g>

        <g>
          <rect
            x="130"
            y="70"
            width="80"
            height="48"
            fill="#fd7800"
            fill-opacity=".12"
            stroke="#fd7800"
          />
          <text
            x="170"
            y="92"
            fill="#fd7800"
            font-size="8"
            font-weight="700"
            text-anchor="middle"
            letter-spacing="1"
          >
            FACE
          </text>
          <text
            x="170"
            y="106"
            fill="currentColor"
            opacity=".55"
            font-size="6"
            text-anchor="middle"
          >
            name / state
          </text>
        </g>

        <g>
          <rect
            x="226"
            y="78"
            width="76"
            height="34"
            stroke="#fd7800"
            stroke-opacity=".7"
            stroke-dasharray="3 3"
          />
          <text
            x="238"
            y="98"
            fill="currentColor"
            font-weight="700"
            letter-spacing=".6"
          >
            NDN
          </text>
        </g>

        <text
          x="18"
          y="188"
          fill="currentColor"
          opacity=".35"
          font-size="6"
          letter-spacing=".8"
        >
          TWO LAYERS / ONE ABSTRACTION
        </text>
      </g>

      <g v-else class="font-mono">
        <text
          x="18"
          y="17"
          fill="currentColor"
          opacity=".42"
          font-size="6.5"
          letter-spacing="1"
        >
          NSDI '24 / REPORTED RESULTS
        </text>
        <text
          x="302"
          y="17"
          fill="#fd7800"
          text-anchor="end"
          font-size="6.5"
          letter-spacing="1"
        >
          iStack
        </text>

        <path
          d="M32 160H288M32 120H288M32 80H288"
          stroke="currentColor"
          stroke-opacity=".16"
          stroke-dasharray="2 4"
        />
        <path d="M32 160H288" stroke="currentColor" stroke-opacity=".4" />

        <g>
          <rect x="58" y="100" width="44" height="60" fill="#fd7800" />
          <text
            x="80"
            y="88"
            fill="currentColor"
            font-size="11"
            font-weight="700"
            text-anchor="middle"
          >
            6.50
          </text>
          <text
            x="80"
            y="176"
            fill="currentColor"
            opacity=".45"
            font-size="6.5"
            text-anchor="middle"
            letter-spacing=".6"
          >
            Gbps
          </text>
        </g>

        <g>
          <rect
            x="138"
            y="60"
            width="44"
            height="100"
            fill="currentColor"
            fill-opacity=".08"
            stroke="currentColor"
            stroke-opacity=".45"
          />
          <text
            x="160"
            y="48"
            fill="currentColor"
            font-size="11"
            font-weight="700"
            text-anchor="middle"
          >
            16.25
          </text>
          <text
            x="160"
            y="176"
            fill="currentColor"
            opacity=".45"
            font-size="6.5"
            text-anchor="middle"
            letter-spacing=".6"
          >
            SPEEDUP
          </text>
        </g>

        <g>
          <rect
            x="218"
            y="82"
            width="44"
            height="78"
            fill="#fd7800"
            fill-opacity=".55"
            stroke="#fd7800"
          />
          <text
            x="240"
            y="70"
            fill="currentColor"
            font-size="11"
            font-weight="700"
            text-anchor="middle"
          >
            46.08
          </text>
          <text
            x="240"
            y="176"
            fill="currentColor"
            opacity=".45"
            font-size="6.5"
            text-anchor="middle"
            letter-spacing=".6"
          >
            % LOWER
          </text>
        </g>
      </g>
    </svg>

    <span
      class="absolute right-3 top-2 font-mono text-[10px] uppercase tracking-[0.12em] text-black/40 dark:text-white/40"
    >
      {{ meta.code }}
    </span>
  </div>
</template>
