import type { Unit } from "../../../shared/types";
import { gearCatalog, type Gear } from "../model/gear";
import { talentCatalog } from "../model/talents";
import { missingMods } from "./mods";
function excluded(a: Gear, b: Gear) {
  return (
    (b.group && a.excludes?.includes(b.group)) ||
    (a.group && b.excludes?.includes(a.group))
  );
}
export function unitConflicts(u: Unit): string[] {
  const lo = u.loadout;
  if (!lo) return [];
  const msgs: string[] = [];
  const talents = lo.talents
    .map((id) => talentCatalog[id])
    .filter((t) => t !== undefined);
  if (lo.talents.length > 1) msgs.push("天赋最多选择 1 项，请移除多余天赋");
  for (const t of talents)
    if (!t.jobs.includes(u.job))
      msgs.push(`天赋「${t.name}」不适用于当前职业`);
  const items = lo.gear.map((id) => gearCatalog[id]).filter((g) => g !== undefined);
  const slots = new Map<string, string[]>();
  for (const g of items) {
    const list = slots.get(g.slot) ?? [];
    list.push(g.name);
    slots.set(g.slot, list);
  }
  for (const names of slots.values())
    if (names.length > 1) msgs.push(`同一部位只能装备 1 件：${names.join("、")}`);
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (excluded(items[i], items[j]))
        msgs.push(`「${items[i].name}」与「${items[j].name}」互斥，不能同时装备`);
  return msgs;
}
export function unitMissing(u: Unit): string[] {
  return missingMods(u).map((s) => s.id);
}
export interface LoadoutProblem {
  unitId: string;
  unitName: string;
  problems: string[];
}
export function allProblems(units: Unit[]): LoadoutProblem[] {
  return units
    .map((u) => ({
      unitId: u.id,
      unitName: u.name,
      problems: [
        ...unitConflicts(u),
        ...unitMissing(u).map((id) => `「${id}」缺失定义，请修复或移除`),
      ],
    }))
    .filter((p) => p.problems.length > 0);
}
