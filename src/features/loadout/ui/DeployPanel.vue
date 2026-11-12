<script setup lang="ts">
import { computed } from "vue";
import type { Unit } from "../../../shared/types";
import { professions } from "../../roster/model/professions";
import { skillBook } from "../../tactics/model/skills";
import { baseCost, movementCost, terrainRules } from "../../terrain/lib/cost";
import type { Terrain } from "../../../shared/types";
import { gearBySlot, slotNames, type Gear } from "../model/gear";
import { talentsFor } from "../model/talents";
import {
  effectiveStats,
  effectiveSkill,
  missingMods,
  modSources,
} from "../lib/mods";
import { allProblems, unitConflicts } from "../lib/validate";
const props = defineProps<{
  units: Unit[];
  selected: string;
  skill: string;
  notice: string;
}>();
const emit = defineEmits<{
  select: [id: string];
  toggleTalent: [id: string];
  toggleGear: [id: string];
  repair: [];
  skill: [id: string];
  start: [];
}>();
const unit = computed(
  () => props.units.find((u) => u.id === props.selected) ?? props.units[0],
);
const eff = computed(() => effectiveStats(unit.value));
const base = computed(() => professions[unit.value.job]);
const conflicts = computed(() => unitConflicts(unit.value));
const missing = computed(() => missingMods(unit.value));
const problems = computed(() => allProblems(props.units));
const sourceMods = computed(() => {
  const map: Record<string, { label: string; mods: Record<string, number> }> =
    {};
  for (const s of modSources(unit.value))
    map[s.id] = { label: s.label, mods: s.mods as Record<string, number> };
  return map;
});
const statRows = computed(() => {
  const e = eff.value,
    b = base.value;
  const sources = (key: "hp" | "power" | "armor" | "speed" | "move") =>
    Object.values(sourceMods.value)
      .filter((s) => (s.mods[key] ?? 0) !== 0)
      .map((s) => `${s.mods[key] > 0 ? "+" : ""}${s.mods[key]} ${s.label}`);
  return (
    [
      ["生命", b.hp, e.hp],
      ["攻击", b.power, e.power],
      ["护甲", b.armor, e.armor],
      ["速度", b.speed, e.speed],
      ["移动", b.move, e.move],
    ] as [string, number, number][]
  ).map(([label, bv, ev], i) => ({
    label,
    base: bv,
    eff: ev,
    sources: sources(
      (["hp", "power", "armor", "speed", "move"] as const)[i],
    ),
  }));
});
const skills = computed(() =>
  skillBook[unit.value.job].map((s) => ({
    base: s,
    eff: effectiveSkill(unit.value, s),
  })),
);
const terrains = computed(() =>
  (Object.keys(terrainRules) as Terrain[]).map((t) => ({
    id: t,
    name: terrainRules[t].name,
    base: baseCost(t, unit.value),
    eff: movementCost(t, unit.value),
  })),
);
const slots: Gear["slot"][] = ["weapon", "armor", "boots", "charm"];
const fmt = (n: number) => (Number.isFinite(n) ? n : "×");
</script>
<template>
  <section class="panel deploy-panel">
    <div class="eyebrow">03 / DEPLOYMENT</div>
    <h3>战前部署 <small>开战后锁定本场配装</small></h3>
    <div class="deploy-units">
      <button
        v-for="u in units"
        :key="u.id"
        :class="['deploy-tab', u.team, { chosen: u.id === unit.id }]"
        @click="emit('select', u.id)"
      >
        {{ u.name
        }}<i
          v-if="unitConflicts(u).length || missingMods(u).length"
          class="warn"
          >!</i
        >
      </button>
    </div>
    <div class="deploy-body">
      <div class="deploy-section">
        <h4>天赋 <small>限选 1 项</small></h4>
        <div class="chip-list">
          <button
            v-for="t in talentsFor(unit.job)"
            :key="t.id"
            :class="{ chosen: unit.loadout?.talents.includes(t.id) }"
            @click="emit('toggleTalent', t.id)"
          >
            <b>{{ t.name }}</b
            ><small>{{ t.description }}</small>
          </button>
        </div>
      </div>
      <div v-for="slot in slots" :key="slot" class="deploy-section">
        <h4>{{ slotNames[slot] }}</h4>
        <div class="chip-list">
          <button
            v-for="g in gearBySlot(slot)"
            :key="g.id"
            :class="{ chosen: unit.loadout?.gear.includes(g.id) }"
            @click="emit('toggleGear', g.id)"
          >
            <b>{{ g.name }}</b
            ><small>{{ g.description }}</small>
          </button>
        </div>
      </div>
      <div v-if="missing.length" class="deploy-warning">
        <b>缺失定义的配装（保留原始配置，未做替换）</b>
        <p v-for="m in missing" :key="m.id">
          {{ m.kind === "talent" ? "天赋" : "装备" }}「{{ m.id }}」
          在当前版本中不存在，加成未生效。
        </p>
        <button @click="emit('repair')">移除失效配置并重新选择</button>
      </div>
      <div v-if="conflicts.length" class="deploy-conflicts">
        <b>存在冲突，无法开战：</b>
        <p v-for="c in conflicts" :key="c">✕ {{ c }}</p>
      </div>
      <div class="deploy-section">
        <h4>生效属性 <small>基础值 + 加成来源</small></h4>
        <table class="stat-table">
          <tr v-for="row in statRows" :key="row.label">
            <th>{{ row.label }}</th>
            <td>{{ row.base }}</td>
            <td class="sources">
              {{ row.sources.join("；") || "—" }}
            </td>
            <td :class="['eff', { buffed: row.eff !== row.base }]">
              {{ row.eff }}
            </td>
          </tr>
          <tr v-if="eff.skillRange || eff.skillPower">
            <th>技能</th>
            <td>—</td>
            <td class="sources">
              {{
                [
                  eff.skillRange ? `射程 +${eff.skillRange}` : "",
                  eff.skillPower ? `威力 +${eff.skillPower}` : "",
                ]
                  .filter(Boolean)
                  .join("；")
              }}
            </td>
            <td class="eff buffed">✦</td>
          </tr>
        </table>
      </div>
      <div class="deploy-section">
        <h4>地形适应 <small>每格移动消耗</small></h4>
        <div class="terrain-costs">
          <span v-for="t in terrains" :key="t.id" :class="{ buffed: t.eff !== t.base }"
            >{{ t.name }} {{ fmt(t.eff)
            }}<small v-if="t.eff !== t.base">（基础 {{ fmt(t.base) }}）</small></span
          >
        </div>
      </div>
      <div class="deploy-section">
        <h4>技能预览 <small>点击后在地图上查看射程</small></h4>
        <div class="deploy-skills">
          <button
            v-for="s in skills"
            :key="s.base.id"
            :class="{ chosen: skill === s.base.id }"
            @click="emit('skill', skill === s.base.id ? '' : s.base.id)"
          >
            <span
              >{{ s.base.name }}
              <small
                >射程 {{ s.eff.range
                }}<i v-if="s.eff.range !== s.base.range"
                  >（基础 {{ s.base.range }}）</i
                ></small
              ></span
            >
            <small>
              <template v-if="s.base.target === 'ally'"
                >恢复 {{ s.eff.power }}</template
              >
              <template v-else-if="s.base.target === 'self'">自身增益</template>
              <template v-else
                >威力 {{ s.eff.power
                }}<i v-if="s.eff.power !== s.base.power"
                  >（基础 {{ s.base.power }}）</i
                >，理论伤害 {{ eff.power + s.eff.power }}（未计护甲与掩护）</template
              >
            </small>
          </button>
        </div>
      </div>
    </div>
    <div v-if="problems.length" class="deploy-conflicts global">
      <b>开战后配装将锁定，请先解决以下问题：</b>
      <p v-for="p in problems" :key="p.unitId">
        {{ p.unitName }}：{{ p.problems.join("；") }}
      </p>
    </div>
    <button
      class="primary end-turn"
      :disabled="problems.length > 0"
      @click="emit('start')"
    >
      开战，锁定配装 <span>→</span>
    </button>
    <p class="notice" role="status">{{ notice }}</p>
  </section>
</template>
