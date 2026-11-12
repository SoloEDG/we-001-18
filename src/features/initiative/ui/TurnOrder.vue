<script setup lang="ts">
import type { Battle } from "../../../shared/types";
import { effectiveStats } from "../../loadout/lib/mods";
import { turnLabel, turnProgress } from "../model/clock";
const props = defineProps<{ battle: Battle }>();
const speedOf = (id: string) => {
  const u = props.battle.units.find((u) => u.id === id);
  return u ? effectiveStats(u).speed : "";
};
</script>
<template>
  <section class="turn-strip">
    <div>
      <div class="eyebrow">INITIATIVE / 速度降序</div>
      <h3>{{ turnLabel(battle) }}</h3>
    </div>
    <div class="queue">
      <span
        v-for="(id, i) in battle.queue"
        :key="id"
        :class="[
          'queue-item',
          battle.units.find((u) => u.id === id)?.team,
          { current: i === 0 },
        ]"
        ><small>{{ String(i + 1).padStart(2, "0") }}</small
        >{{ battle.units.find((u) => u.id === id)?.name
        }}<b>{{ speedOf(id) }}</b></span
      >
    </div>
    <div class="round-meter">
      <b>{{ turnProgress(battle) }}%</b><small>回合进度</small>
    </div>
  </section>
</template>
