import type { Battle, Session } from "../../../shared/types";
import { assertBattle } from "../../../shared/document";
export function saveArchive(s: Session) {
  localStorage.setItem("we001-session", JSON.stringify(s));
}
function migrateBattle(b: Battle) {
  for (const u of b.units)
    if (!u.loadout) u.loadout = { talents: [], gear: [] };
}
function migrate(s: Session) {
  if (s.phase !== "deploy" && s.phase !== "battle") s.phase = "battle";
  migrateBattle(s.live);
  migrateBattle(s.initial);
  for (const e of s.events) {
    migrateBattle(e.before);
    migrateBattle(e.after);
  }
  return s;
}
export function loadArchive(): Session | null {
  try {
    const raw = localStorage.getItem("we001-session");
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    assertBattle(s.live);
    assertBattle(s.initial);
    if (!Array.isArray(s.events)) return null;
    return migrate(s);
  } catch {
    return null;
  }
}
export function downloadArchive(s: Session) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "灰烬渡口-战斗记录.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
