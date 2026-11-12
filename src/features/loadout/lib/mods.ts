import type { Skill, Terrain, Unit } from "../../../shared/types";
import { professions } from "../../roster/model/professions";
import { gearCatalog, type StatMods } from "../model/gear";
import { talentCatalog } from "../model/talents";
export interface ModSource {
  id: string;
  label: string;
  kind: "talent" | "gear";
  mods: StatMods;
  missing?: boolean;
}
export function modSources(u: Unit): ModSource[] {
  const lo = u.loadout;
  const out: ModSource[] = [];
  for (const id of lo?.talents ?? []) {
    const t = talentCatalog[id];
    out.push(
      t
        ? { id, label: t.name, kind: "talent", mods: t.mods }
        : { id, label: id, kind: "talent", mods: {}, missing: true },
    );
  }
  for (const id of lo?.gear ?? []) {
    const g = gearCatalog[id];
    out.push(
      g
        ? { id, label: g.name, kind: "gear", mods: g.mods }
        : { id, label: id, kind: "gear", mods: {}, missing: true },
    );
  }
  return out;
}
export function missingMods(u: Unit): ModSource[] {
  return modSources(u).filter((s) => s.missing);
}
export interface EffectiveStats {
  hp: number;
  power: number;
  armor: number;
  speed: number;
  move: number;
  skillRange: number;
  skillPower: number;
  terrain: Partial<Record<Terrain, number>>;
}
export function effectiveStats(u: Unit): EffectiveStats {
  const base = professions[u.job];
  const eff: EffectiveStats = {
    hp: base.hp,
    power: base.power,
    armor: base.armor,
    speed: base.speed,
    move: base.move,
    skillRange: 0,
    skillPower: 0,
    terrain: {},
  };
  for (const s of modSources(u)) {
    const m = s.mods;
    eff.hp += m.hp ?? 0;
    eff.power += m.power ?? 0;
    eff.armor += m.armor ?? 0;
    eff.speed += m.speed ?? 0;
    eff.move += m.move ?? 0;
    eff.skillRange += m.skillRange ?? 0;
    eff.skillPower += m.skillPower ?? 0;
    Object.assign(eff.terrain, m.terrain);
  }
  eff.hp = Math.max(1, eff.hp);
  eff.armor = Math.max(0, eff.armor);
  eff.speed = Math.max(1, eff.speed);
  eff.move = Math.max(1, eff.move);
  return eff;
}
export function effectiveSkill(u: Unit, s: Skill): Skill {
  const eff = effectiveStats(u);
  return {
    ...s,
    range: s.range > 0 ? s.range + eff.skillRange : s.range,
    power: s.power > 0 ? s.power + eff.skillPower : s.power,
  };
}
export function formatMods(m: StatMods): string {
  const parts: string[] = [];
  const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
  if (m.hp) parts.push(`生命 ${signed(m.hp)}`);
  if (m.power) parts.push(`攻击 ${signed(m.power)}`);
  if (m.armor) parts.push(`护甲 ${signed(m.armor)}`);
  if (m.speed) parts.push(`速度 ${signed(m.speed)}`);
  if (m.move) parts.push(`移动 ${signed(m.move)}`);
  if (m.skillRange) parts.push(`射程 ${signed(m.skillRange)}`);
  if (m.skillPower) parts.push(`威力 ${signed(m.skillPower)}`);
  return parts.join("，");
}
