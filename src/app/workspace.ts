import { computed, reactive, ref } from "vue";
import type { Point, Terrain, Unit } from "../shared/types";
import { clone, findUnit, key } from "../shared/document";
import { reachable, terrainRules, paintTile } from "../features/terrain";
import { moveBudget, armorValue, tickStatuses } from "../features/roster";
import {
  getSkill,
  legalTargets,
  moveUnit,
  castSkill,
} from "../features/tactics";
import { finishTurn } from "../features/initiative";
import {
  record,
  frame,
  loadArchive,
  saveArchive,
  usePlayback,
} from "../features/replay";
import {
  allProblems,
  effectiveSkill,
  effectiveStats,
  gearCatalog,
  talentCatalog,
} from "../features/loadout";
import { newSession, startBattle } from "./session";
export function useWorkspace() {
  const session = reactive(loadArchive() ?? newSession());
  const cursor = ref(-1),
    selected = ref(session.live.active || session.live.units[0].id),
    skill = ref(""),
    brush = ref<Terrain | null>(null),
    notice = ref(
      session.phase === "deploy"
        ? "部署阶段：为每名角色选择天赋与装备，点击地图预览移动范围。"
        : "选择蓝色格移动，或选择技能指定目标。",
    );
  const playback = usePlayback(
    () => session.events.length,
    (n) => {
      cursor.value = n;
    },
  );
  const deploy = computed(() => session.phase === "deploy");
  const battle = computed(() => frame(session, cursor.value));
  const actor = computed(() =>
    battle.value.active ? findUnit(battle.value, battle.value.active) : null,
  );
  const focus = computed(() =>
    deploy.value
      ? (session.live.units.find((u) => u.id === selected.value) ??
        session.live.units[0])
      : actor.value,
  );
  const locked = computed(() => cursor.value >= 0 || !!session.live.ended);
  const routes = computed(() => {
    const u = focus.value;
    if (locked.value || !u || u.hp <= 0) return new Map();
    if (!deploy.value && (u.moved || u.acted)) return new Map();
    return reachable(session.live, u, moveBudget(u));
  });
  const targets = computed(() => {
    const u = focus.value;
    const base = u ? getSkill(u.job, skill.value) : undefined;
    return u && base
      ? legalTargets(battle.value, u, effectiveSkill(u, base))
      : [];
  });
  function cell(p: Point) {
    try {
      if (locked.value) throw new Error("回放只读，请返回实战");
      if (brush.value) {
        const before = clone(session.live);
        paintTile(session.live, p, brush.value);
        if (!deploy.value)
          record(
            session,
            before,
            "terrain",
            `地形调整为${terrainRules[brush.value].name}`,
          );
      } else if (deploy.value) {
        const u = session.live.units.find(
          (v) => v.hp > 0 && key(v) === key(p),
        );
        if (u) {
          selected.value = u.id;
          notice.value = `部署 ${u.name}：选择天赋与装备，地图预览移动范围。`;
        }
        saveArchive(session);
        return;
      } else if (skill.value) {
        const u = actor.value!;
        const s = effectiveSkill(u, getSkill(u.job, skill.value)!);
        const t = session.live.units.find((t) => t.hp > 0 && key(t) === key(p));
        if (!t) throw new Error("请点击合法角色");
        const before = clone(session.live);
        const ground = session.live.tiles.find((v) => key(v) === key(t))!;
        const high =
          session.live.tiles.find((v) => key(v) === key(u))!.terrain ===
          "ridge";
        const value = castSkill(
          session.live,
          u.id,
          t.id,
          s,
          armorValue(t),
          terrainRules[ground.terrain].cover,
          high,
        );
        record(
          session,
          before,
          "skill",
          `${u.name} → ${t.name} · ${s.name} ${value}`,
        );
        skill.value = "";
      } else {
        const u = actor.value!;
        const route = routes.value.get(key(p));
        if (!route?.path.length)
          throw new Error("此格不可达，请检查地形与占位");
        const before = clone(session.live);
        moveUnit(session.live, u.id, route.path);
        record(
          session,
          before,
          "move",
          `${u.name}移动 · 消耗${route.cost}`,
          route.path,
        );
      }
      saveArchive(session);
      notice.value = deploy.value
        ? "地形已调整，继续部署。"
        : session.events.at(-1)!.label;
    } catch (e) {
      notice.value = (e as Error).message;
    }
  }
  function wait() {
    if (locked.value || deploy.value) return;
    const before = clone(session.live);
    finishTurn(session.live, tickStatuses);
    record(
      session,
      before,
      "wait",
      `${findUnit(before, before.active).name}结束行动`,
    );
    selected.value = session.live.active;
    skill.value = "";
    saveArchive(session);
  }
  function seek(n: number) {
    playback.stop();
    cursor.value = n;
    skill.value = "";
    brush.value = null;
  }
  function reset() {
    playback.stop();
    Object.assign(session, newSession());
    cursor.value = -1;
    selected.value = session.live.units[0].id;
    skill.value = "";
    brush.value = null;
    saveArchive(session);
    notice.value = "部署阶段：为每名角色选择天赋与装备。";
  }
  function refreshVitals(u: Unit) {
    u.maxHp = effectiveStats(u).hp;
    u.hp = u.maxHp;
  }
  function toggleTalent(id: string) {
    const u = focus.value;
    if (!deploy.value || !u) return;
    u.loadout ??= { talents: [], gear: [] };
    u.loadout.talents = u.loadout.talents.includes(id)
      ? u.loadout.talents.filter((t) => t !== id)
      : [id];
    refreshVitals(u);
    saveArchive(session);
  }
  function toggleGear(id: string) {
    const u = focus.value;
    const item = gearCatalog[id];
    if (!deploy.value || !u || !item) return;
    u.loadout ??= { talents: [], gear: [] };
    if (u.loadout.gear.includes(id)) {
      u.loadout.gear = u.loadout.gear.filter((g) => g !== id);
    } else {
      u.loadout.gear = u.loadout.gear.filter(
        (g) => gearCatalog[g]?.slot !== item.slot,
      );
      u.loadout.gear.push(id);
    }
    refreshVitals(u);
    saveArchive(session);
  }
  function repair() {
    const u = focus.value;
    if (!deploy.value || !u?.loadout) return;
    u.loadout.talents = u.loadout.talents.filter((id) => talentCatalog[id]);
    u.loadout.gear = u.loadout.gear.filter((id) => gearCatalog[id]);
    refreshVitals(u);
    saveArchive(session);
    notice.value = "已移除缺失定义的配装，请重新选择。";
  }
  function start() {
    const problems = allProblems(session.live.units);
    if (problems.length) {
      notice.value = `无法开战：${problems
        .map((p) => `${p.unitName}（${p.problems.join("；")}）`)
        .join("；")}`;
      return;
    }
    startBattle(session);
    selected.value = session.live.active;
    skill.value = "";
    saveArchive(session);
    notice.value = "战斗开始，本场配装已锁定。";
  }
  const path = computed(() =>
    cursor.value > 0 ? (session.events[cursor.value - 1]?.path ?? []) : [],
  );
  return {
    session,
    cursor,
    selected,
    skill,
    brush,
    notice,
    battle,
    actor,
    deploy,
    locked,
    routes,
    targets,
    path,
    playback,
    cell,
    wait,
    seek,
    reset,
    toggleTalent,
    toggleGear,
    repair,
    start,
  };
}
