import type { Terrain } from "../../../shared/types";
export interface StatMods {
  hp?: number;
  power?: number;
  armor?: number;
  speed?: number;
  move?: number;
  skillRange?: number;
  skillPower?: number;
  terrain?: Partial<Record<Terrain, number>>;
}
export interface Gear {
  id: string;
  name: string;
  slot: "weapon" | "armor" | "boots" | "charm";
  mods: StatMods;
  group?: string;
  excludes?: string[];
  description: string;
}
export const slotNames: Record<Gear["slot"], string> = {
  weapon: "武器",
  armor: "护甲",
  boots: "足具",
  charm: "饰品",
};
const gearList: Gear[] = [
  {
    id: "warblade",
    name: "战刃",
    slot: "weapon",
    mods: { power: 2 },
    description: "攻击 +2",
  },
  {
    id: "longspear",
    name: "长枪",
    slot: "weapon",
    mods: { power: 1, skillRange: 1 },
    description: "攻击 +1，技能射程 +1",
  },
  {
    id: "oakstaff",
    name: "橡木法杖",
    slot: "weapon",
    mods: { skillPower: 2 },
    description: "技能威力 +2",
  },
  {
    id: "plate",
    name: "重装板甲",
    slot: "armor",
    group: "heavy",
    excludes: ["light"],
    mods: { armor: 3, speed: -1, move: -1 },
    description: "护甲 +3，速度 -1，移动 -1；与轻装互斥",
  },
  {
    id: "leather",
    name: "皮甲",
    slot: "armor",
    mods: { armor: 1, speed: 1 },
    description: "护甲 +1，速度 +1",
  },
  {
    id: "cloak",
    name: "风行斗篷",
    slot: "armor",
    group: "light",
    excludes: ["heavy"],
    mods: { move: 1 },
    description: "移动 +1；与重装互斥",
  },
  {
    id: "striders",
    name: "渡水靴",
    slot: "boots",
    mods: { terrain: { water: 1 } },
    description: "浅滩移动消耗降为 1",
  },
  {
    id: "climbers",
    name: "登山爪",
    slot: "boots",
    mods: { terrain: { ridge: 1 } },
    description: "高地移动消耗降为 1",
  },
  {
    id: "windboots",
    name: "风行靴",
    slot: "boots",
    group: "light",
    excludes: ["heavy"],
    mods: { move: 1, speed: 1 },
    description: "移动 +1，速度 +1；与重装互斥",
  },
  {
    id: "focus",
    name: "专注符印",
    slot: "charm",
    mods: { skillRange: 1 },
    description: "技能射程 +1",
  },
  {
    id: "ember",
    name: "余烬护符",
    slot: "charm",
    mods: { skillPower: 1, power: 1 },
    description: "技能威力 +1，攻击 +1",
  },
  {
    id: "vitality",
    name: "生命坠饰",
    slot: "charm",
    mods: { hp: 6 },
    description: "生命上限 +6",
  },
];
export const gearCatalog: Record<string, Gear> = Object.fromEntries(
  gearList.map((g) => [g.id, g]),
);
export const gearBySlot = (slot: Gear["slot"]) =>
  gearList.filter((g) => g.slot === slot);
