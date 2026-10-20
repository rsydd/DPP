const { readJson, writeJson } = require("./storage");

const ROLES = ["Assassin", "Fighter", "Mage", "Marksman", "Tank", "Support"];
const LANES = ["EXP", "Jungle", "Mid", "Gold", "Roam"];

const DEFAULT_LANES = {
  Assassin: ["Jungle"],
  Fighter: ["EXP", "Jungle"],
  Mage: ["Mid"],
  Marksman: ["Gold"],
  Tank: ["Roam", "EXP"],
  Support: ["Roam"]
};

function withLanes(hero) {
  if (Array.isArray(hero.lanes) && hero.lanes.length) return hero;
  return { ...hero, lanes: DEFAULT_LANES[hero.role] || [] };
}

function allHeroes() {
  return readJson("heroes.json", []).map(withLanes);
}

function saveHeroes(heroes) {
  writeJson("heroes.json", heroes);
}

function nextID(heroes) {
  return heroes.reduce((max, hero) => Math.max(max, Number(hero.id) || 0), 0) + 1;
}

function findHeroById(id) {
  return allHeroes().find(hero => hero.id === Number(id));
}

function matchIgnoreCase(value, list) {
  return list.find(item => item.toLowerCase() === String(value || "").trim().toLowerCase());
}

function normalizeInput(input) {
  return {
    name: String(input.name || "").trim(),
    role: matchIgnoreCase(input.role, ROLES) || input.role,
    lanes: [...new Set((Array.isArray(input.lanes) ? input.lanes : []).map(l => matchIgnoreCase(l, LANES) || l))]
  };
}

function validateHero(input, existingHeroes, ignoreID = null) {
  const errors = [];
  const name = String(input.name || "").trim();
  if (!name) errors.push("Nama hero wajib diisi.");

  const duplicate = existingHeroes.some(
    h => h.name.toLowerCase() === name.toLowerCase() && h.id !== ignoreID
  );
  if (duplicate) errors.push("Nama hero sudah ada.");

  if (!ROLES.includes(input.role)) errors.push(`Role harus salah satu dari ${ROLES.join(", ")}.`);
  if (!Array.isArray(input.lanes) || input.lanes.length === 0 || input.lanes.some(lane => !LANES.includes(lane))) {
    errors.push(`Pilih minimal satu lane valid: ${LANES.join(", ")}.`);
  }
  return errors;
}

function addHeroes(input) {
  const heroes = allHeroes();
  const normalized = { id: nextID(heroes), ...normalizeInput(input) };
  const errors = validateHero(normalized, heroes);
  if (errors.length) return { ok: false, errors };
  heroes.push(normalized);
  saveHeroes(heroes);
  return { ok: true, hero: normalized };
}

function updateHeroes(id, input) {
  const heroes = allHeroes();
  const index = heroes.findIndex(hero => hero.id === Number(id));
  if (index === -1) return { ok: false, errors: ["Hero tidak ditemukan."] };

  const normalized = { ...heroes[index], ...normalizeInput(input) };
  const errors = validateHero(normalized, heroes, Number(id));
  if (errors.length) return { ok: false, errors };
  heroes[index] = normalized;
  saveHeroes(heroes);
  return { ok: true, hero: normalized };
}

function deleteHeroes(id) {
  const heroes = allHeroes();
  const hero = heroes.find(h => h.id === Number(id));
  if (!hero) return { ok: false, message: "Hero tidak ditemukan." };
  saveHeroes(heroes.filter(h => h.id !== Number(id)));
  return { ok: true, hero };
}

module.exports = { ROLES, LANES, allHeroes, findHeroById, addHeroes, updateHeroes, deleteHeroes };
