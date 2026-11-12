<script setup lang="ts">
import { computed } from "vue";
import type { Unit } from "../../../shared/types";
import { effectiveStats, modSources } from "../../loadout/lib/mods";
import { professions } from "../model/professions";
import { statusNames } from "../lib/status";
const props = defineProps<{ units: Unit[]; selected: string; active: string }>();
defineEmits<{ select: [id: string] }>();
const detail = computed(
  () => props.units.find((u) => u.id === props.selected) ?? null,
);
const statLine = (u: Unit) => {
  const e = effectiveStats(u),
    b = professions[u.job];
  const cell = (label: string, v: number, bv: number) =>
    `${label}${v}${v > bv ? "↑" : v < bv ? "↓" : ""}`;
  return [
    cell("移", e.move, b.move),
    cell("攻", e.power, b.power),
    cell("防", e.armor, b.armor),
    cell("速", e.speed, b.speed),
  ].join(" ");
};
const breakdown = computed(() => {
  const u = detail.value;
  if (!u) return null;
  const e = effectiveStats(u),
    b = professions[u.job],
    sources = modSources(u);
  const rows = (
    [
      ["生命", b.hp, e.hp, "hp"],
      ["攻击", b.power, e.power, "power"],
      ["护甲", b.armor, e.armor, "armor"],
      ["速度", b.speed, e.speed, "speed"],
      ["移动", b.move, e.move, "move"],
    ] as [string, number, number, "hp" | "power" | "armor" | "speed" | "move"][]
  ).map(([label, bv, ev, key]) => ({
    label,
    base: bv,
    eff: ev,
    from: sources
      .filter((s) => ((s.mods as Record<string, number>)[key] ?? 0) !== 0)
      .map(
        (s) =>
          `${(s.mods as Record<string, number>)[key] > 0 ? "+" : ""}${
            (s.mods as Record<string, number>)[key]
          } ${s.label}`,
      ),
  }));
  const extra = sources.filter(
    (s) => s.mods.skillRange || s.mods.skillPower || s.mods.terrain,
  );
  return { rows, extra, missing: sources.filter((s) => s.missing) };
});
</script>
<template>
  <section class="panel roster-panel">
    <div class="eyebrow">02 / COMBAT SQUAD</div>
    <h3>
      战场编队 <small>{{ units.filter((u) => u.hp > 0).length }} 名存活</small>
    </h3>
    <button
      v-for="u in units"
      :key="u.id"
      :data-unit="u.id"
      :class="[
        'unit-row',
        u.team,
        { chosen: u.id === selected, dead: u.hp <= 0 },
      ]"
      @click="$emit('select', u.id)"
    >
      <span class="avatar">{{ u.name.slice(0, 1) }}</span
      ><span class="unit-name"
        ><b>{{ u.name }} <i v-if="u.id === active">行动中</i></b
        ><small
          >{{ professions[u.job].name }} ·
          {{ u.team === "azure" ? "苍蓝" : "余烬" }}</small
        ><small class="stat-line">{{ statLine(u) }}</small
        ><span class="hp-track"
          ><i :style="{ width: (u.hp / u.maxHp) * 100 + '%' }" /></span></span
      ><span class="hp-value"
        >{{ u.hp }}<small>/{{ u.maxHp }}</small
        ><small>{{
          u.statuses.map((s) => statusNames[s.kind] + s.turns).join(" ") ||
          "状态正常"
        }}</small></span
      >
    </button>
    <div v-if="detail && breakdown" class="stat-breakdown">
      <h4>
        {{ detail.name }} · 属性构成
        <small v-if="breakdown.missing.length" class="warn-text"
          >含缺失定义的配装</small
        >
      </h4>
      <table class="stat-table">
        <tr v-for="row in breakdown.rows" :key="row.label">
          <th>{{ row.label }}</th>
          <td>{{ row.base }}</td>
          <td class="sources">{{ row.from.join("；") || "—" }}</td>
          <td :class="['eff', { buffed: row.eff !== row.base }]">
            {{ row.eff }}
          </td>
        </tr>
      </table>
      <p v-for="s in breakdown.extra" :key="s.id" class="extra-mods">
        {{ s.label }}：{{ s.mods.skillRange ? `射程 +${s.mods.skillRange} ` : ""
        }}{{ s.mods.skillPower ? `威力 +${s.mods.skillPower} ` : ""
        }}{{ s.mods.terrain ? "地形适应" : "" }}
      </p>
      <p v-if="!detail.loadout?.talents.length && !detail.loadout?.gear.length">
        未配置天赋与装备，使用职业基础值。
      </p>
    </div>
  </section>
</template>
