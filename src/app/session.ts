import type { Session, Battle } from "../shared/types";
import { clone } from "../shared/document";
import { createMap } from "../features/terrain";
import { createUnits } from "../features/roster";
import { order } from "../features/initiative";
import { effectiveStats } from "../features/loadout";
export function newSession(): Session {
  const live: Battle = {
    tiles: createMap(),
    units: createUnits(),
    round: 1,
    queue: [],
    active: "",
    ended: null,
  };
  for (const u of live.units) u.loadout = { talents: [], gear: [] };
  return { initial: clone(live), live, events: [], phase: "deploy" };
}
export function startBattle(s: Session) {
  for (const u of s.live.units) {
    u.maxHp = effectiveStats(u).hp;
    u.hp = u.maxHp;
  }
  s.live.queue = order(s.live);
  s.live.active = s.live.queue[0];
  s.phase = "battle";
  s.initial = clone(s.live);
}
