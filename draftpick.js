const { readJson, writeJson } = require("./storage");
const { allHeroes, findHeroById, LANES } = require("./heroes");

const REQUIRED_LANES = ["EXP", "Jungle", "Mid", "Gold", "Roam"];

function allDrafts() {
  return readJson("drafts.json", []);
}

function saveDrafts(drafts) {
  writeJson("drafts.json", drafts);
}

function nextDraftId(drafts) {
  return drafts.reduce((max, draft) => Math.max(max, Number(draft.id) || 0), 0) + 1;
}

function createDraft(name) {
  const drafts = allDrafts();
  const cleanName = String(name || "").trim();
  if (!cleanName) return { ok: false, message: "Nama draft wajib diisi." };

  const draft = {
    id: nextDraftId(drafts),
    name: cleanName,
    createdAt: new Date().toISOString(),
    teams: { ours: [], enemy: [] }
  };
  drafts.push(draft);
  saveDrafts(drafts);
  return { ok: true, draft };
}

function findDraft(id) {
  return allDrafts().find(draft => draft.id === Number(id))
}

function addPick(draftId, teamKey, heroId) {
  if (!["Blue", "Red"].includes(teamKey)) {
    return { ok: false, message: "Tim harus Blue (Tim Sendiri) atau Red (Tim Musuh)" };
  }
  const drafts = allDrafts();
  const draft = drafts.find(d => d.id === Number(draftId));
  if (!draft) return { ok: false, message: "Draft tidak ditemukan." };

  const hero = findHeroById(heroId);
  if (!hero) return { ok: false, message: "Hero tidak ditemukan." };

  const allPicks = [...draft.teams.Blue, ...draft.teams.Red];
  if (allPicks.some(pick => pick.heroId === hero.id)) {
    return {ok:false, message: `${hero.name} sudah dipilih dalam draft ini.`}
  }

  if (draft.teams[teamKey].length >= 5) {
    return { ok: false, message: "Satu tim maksimal 5 hero." };
  }

  const pick = {
    heroId: hero.id,
    heroName: hero.name,
    role: hero.role,
    lanes: hero.lanes
  };

  draft.teams[teamKey].push(pick);
  saveDrafts(drafts);
  return { ok: true, draft, pick };
}

function removePick(draftId, teamKey, heroId) {
  const drafts = allDrafts();
  const draft = drafts.find(d => d.id === Number(id));
  if (!draft) return { ok: false, message: "Draft tidak ditemukan." }
  if (!["Blue", "Red"].includes(teamKey)) {
    return { ok: false, message: "Tim tidak valid." };
  }

  const before = draft.teams[teamKey].length;
  draft.teams[teamKey] = draft.teams[teamKey].filter(p => p.heroId !== Number(heroId));
  if (before === draft.teams[teamKey].length) {
    return { ok: false, message: "Pick tidak ditemukan pada tim tersebut." };
  }
  saveDrafts(drafts);
  return { ok: true, draft };
}

function updateDraftName(id, name) {
  const drafts = allDrafts();
  const draft = drafts.find(d => d.id === Number(id));
  if (!draft) return { ok: false, message: "Draft tidak ditemukan" };
  const cleanName = String(name || "").trim();
  if (!cleanName) return { ok: false, message: "Nama draft wajib diisi." };
  draft.name = cleanName;
  saveDrafts(drafts);
  return { ok: true, draft };
}

function deleteDraft(id) {
  const drafts = allDrafts();
  const draft = drafts.find(d => d.id === Number(id));
  if (!draft) return { ok: false, message: "Draft tidak ditemukan" };
  saveDrafts(drafts.filter(d => d.id !== Number(id)));
  return { ok: true, draft };
}

function validateTeam(picks) {
  const usedLanes = new Set();
  const unassigned = [];

  for (const pick of picks) {
    const hero = findHeroById(pick.heroId);
    const lane = hero?.lanes || pick.lanes || [];
    const availLane = lanes.find(lane => REQUIRED_LANES.includes(lane) && !usedLanes.has(lane));
    if (availLane) usedLanes.add(availLane);
    else unassigned.push(pick.heroName);
  }

  const missingLanes = REQUIRED_LANES.filter(lane => !usedLanes.has(lane));
  return {
    validCount: picks.length === 5 && missingLanes.length === 0,
    full: picks.length === 5,
    missingLanes,
    unassigned,
    count: picks.length
  };
}

module.exports = {
  allDrafts, findDraft, createDraft, addPick, removePick,
  updateDraftName, deleteDraft, validateTeam, getDraftAnalysis, REQUIRED_LANES
};
