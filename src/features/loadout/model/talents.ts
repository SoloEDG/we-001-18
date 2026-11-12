import type { Profession } from "../../../shared/types";
import type { StatMods } from "./gear";
export interface Talent {
  id: string;
  name: string;
  jobs: Profession[];
  mods: StatMods;
  description: string;
}
const talentList: Talent[] = [
  {
    id: "stalwart",
    name: "坚韧",
    jobs: ["guard"],
    mods: { hp: 6, armor: 1 },
    description: "生命上限 +6，护甲 +1",
  },
  {
    id: "vanguard",
    name: "先锋",
    jobs: ["guard"],
    mods: { move: 1, power: 1 },
    description: "移动 +1，攻击 +1",
  },
  {
    id: "pathfinder",
    name: "寻路者",
    jobs: ["ranger"],
    mods: { terrain: { forest: 1 } },
    description: "密林移动消耗降为 1",
  },
  {
    id: "deadeye",
    name: "神射",
    jobs: ["ranger"],
    mods: { skillRange: 1, skillPower: 1 },
    description: "技能射程 +1，技能威力 +1",
  },
  {
    id: "arcane",
    name: "奥术涌动",
    jobs: ["mage"],
    mods: { skillPower: 2 },
    description: "技能威力 +2",
  },
  {
    id: "wanderer",
    name: "游学",
    jobs: ["mage"],
    mods: { move: 1, hp: 3 },
    description: "移动 +1，生命上限 +3",
  },
  {
    id: "fieldmedic",
    name: "战场医者",
    jobs: ["medic"],
    mods: { skillPower: 2 },
    description: "技能威力 +2",
  },
  {
    id: "swiftaid",
    name: "迅捷支援",
    jobs: ["medic"],
    mods: { speed: 2, move: 1 },
    description: "速度 +2，移动 +1",
  },
];
export const talentCatalog: Record<string, Talent> = Object.fromEntries(
  talentList.map((t) => [t.id, t]),
);
export const talentsFor = (job: Profession) =>
  talentList.filter((t) => t.jobs.includes(job));
