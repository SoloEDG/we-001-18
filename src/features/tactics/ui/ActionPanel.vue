<script setup lang="ts">
import { computed } from "vue";
import type { Unit } from "../../../shared/types";
import { effectiveSkill } from "../../loadout/lib/mods";
import { skillBook } from "../model/skills";
const props = defineProps<{
  unit: Unit;
  skill: string;
  locked: boolean;
  notice: string;
}>();
defineEmits<{ skill: [id: string]; wait: [] }>();
const skills = computed(() =>
  skillBook[props.unit.job].map((s) => ({ base: s, eff: effectiveSkill(props.unit, s) })),
);
</script>
<template>
  <section class="panel action-panel">
    <div class="eyebrow">03 / TACTICAL ORDERS</div>
    <h3>
      {{ unit.name }}的指令
      <small
        >{{ unit.moved ? "已移动" : "可移动" }} /
        {{ unit.acted ? "已施法" : "可施法" }}</small
      >
    </h3>
    <p class="instruction">
      点击蓝色格移动；选择技能后点击目标。双方均由你指挥。
    </p>
    <div class="skills">
      <button
        v-for="s in skills"
        :key="s.base.id"
        :disabled="locked || unit.acted"
        :class="{ chosen: skill === s.base.id }"
        @click="$emit('skill', skill === s.base.id ? '' : s.base.id)"
      >
        <span
          >{{ s.base.name }}
          <small
            >距离 {{ s.eff.range
            }}<i v-if="s.eff.range !== s.base.range"
              >（基础 {{ s.base.range }}）</i
            ></small
          ></span
        ><small
          >{{ s.base.description
          }}<template v-if="s.eff.power !== s.base.power">
            · 威力 {{ s.eff.power }}（基础 {{ s.base.power }}）</template
          ></small
        >
      </button>
    </div>
    <button class="primary end-turn" :disabled="locked" @click="$emit('wait')">
      结束行动 <span>→</span>
    </button>
    <p class="notice" role="status">{{ notice }}</p>
  </section>
</template>
