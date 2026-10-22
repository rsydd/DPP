const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const heroesApi = require("./heroes");
const draftApi = require("./draftpick");

const rl = readline.createInterface({ input, output });

async function ask(question) {
  return (await rl.question(question)).trim();
}

async function askNumber(question) {
  const value = await ask(question);
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function pause() {
  return ask("Tekan enter untuk kembali ke menu...");
}

function printHeroes(heroes = heroesApi.allHeroes() ?? []) {
  if (!heroes.length) return console.log("Belum ada data hero.");
  console.log("\nID | Nama                 | Role       | Lane");
  console.log("-".repeat(65));
  for (const h of heroes) {
    console.log(
      `${String(h.id).padEnd(2)} | ${h.name.padEnd(20)} | ${h.role.padEnd(10)} | ${(h.lanes || []).join(", ")}`
    );
  }
}

function printHeroDetails(hero) {
  console.log(`\nID         : ${hero.id}`);
  console.log(`Nama       : ${hero.name}`);
  console.log(`Role       : ${hero.role}`);
  console.log(`Lane       : ${(hero.lanes || []).join(", ")}`);
}

async function getHeroInput(existing = {}) {
  const name = await ask(`Nama hero${existing.name ? ` [${existing.name}]` : ""}: `) || existing.name || "";
  const roleText = await ask(`Role (${heroesApi.ROLES.join(" / ")})${existing.role ? ` [${existing.role}]` : ""}: `);
  const role = roleText || existing.role || "";
  const laneText = await ask(`Lane dipisah koma (${heroesApi.LANES.join(", ")})${existing.lanes ? ` [${existing.lanes.join(", ")}]` : ""}: `);
  const lanes = (laneText || (existing.lanes || []).join(",")).split(",").map(s => s.trim()).filter(Boolean);
  return { name, role, lanes };
}

async function heroMenu() {
  while (true) {
    console.log("\n=== CRUD HERO ===");
    console.log("1. Lihat semua hero");
    console.log("2. Cari hero");
    console.log("3. Tambah hero");
    console.log("4. Ubah hero");
    console.log("5. Hapus hero");
    console.log("0. Kembali");
    const choice = await ask("Pilih: ");

    switch (choice) {
      case "1": {
        printHeroes();
        await pause();
        break;
      }
      case "2": {
        const query = (await ask("Cari nama hero: ")).toLowerCase();
        printHeroes(
          (heroesApi.allHeroes() ?? []).filter(h => h.name.toLowerCase().includes(query))
        );
        await pause();
        break;
      }
      case "3": {
        const inputData = await getHeroInput();
        const result = heroesApi.addHeroes(inputData);
        console.log(
          result.ok
            ? `Hero ${result.hero.name} berhasil ditambahkan.`
            : result.errors.join("\n")
        );
        await pause();
        break;
      }
      case "4": {
        printHeroes();
        const id = await askNumber("ID hero yang diubah: ");
        const hero = id ? heroesApi.findHeroById(id) : null;
        if (!hero) {
          console.log("Hero tidak ditemukan.");
        } else {
          const inputData = await getHeroInput(hero);
          const result = heroesApi.updateHeroes(id, inputData);
          console.log(
            result.ok ? "Data hero berhasil diubah." : result.errors.join("\n")
          );
        }
        await pause();
        break;
      }
      case "5": {
        printHeroes();
        const id = await askNumber("ID hero yang dihapus: ");
        const hero = id ? heroesApi.findHeroById(id) : null;
        if (!hero) {
          console.log("Hero tidak ditemukan.");
        } else {
          const confirm = await ask(`Yakin hapus ${hero.name}? (y/n): `);
          if (confirm.toLowerCase() === "y") {
            const result = heroesApi.deleteHeroes(id);
            console.log(result.ok ? "Hero berhasil dihapus." : result.message);
          }
        }
        await pause();
        break;
      }
      case "0":
        return;
      default:
        console.log("Pilihan tidak valid.");
        break;
    }
  }
}

function printDraft(draft) {
  console.log(`\nDraft #${draft.id}: ${draft.name}`);
  for (const [key, label] of [["Blue", "Tim Sendiri"], ["Red", "Tim Lawan"]]) {
    const team = draft.teams?.[key] ?? [];
    console.log(`\n${label} (${team.length}/5)`);
    if (!team.length) console.log(" (belum ada pick)");
    team.forEach((pick, i) => {
      console.log(` ${i + 1}. ${pick.heroName} - ${pick.role} [${(pick.lanes || []).join(", ")}]`);
    });
    const validation = draftApi.validateTeam(team) ?? {};
    console.log(` Lane belum terisi: ${(validation.missingLanes ?? []).join(", ") || "tidak ada"}`);
  }
}

async function chooseDraft() {
  const drafts = draftApi.allDrafts() ?? [];
  if (!drafts.length) {
    console.log("Belum ada draft, buat draft terlebih dahulu.");
    return null;
  }
  drafts.forEach(d =>
    console.log(`${d.id}. ${d.name} (${d.teams?.Blue?.length ?? 0}/5 vs ${d.teams?.Red?.length ?? 0}/5)`)
  );
  const id = await askNumber("ID draft: ");
  const draft = id ? draftApi.findDraft(id) : null;
  if (!draft) console.log("Draft tidak ditemukan.");
  return draft || null;
}

async function manageDraft(draftId) {
  while (true) {
    const draft = draftApi.findDraft(draftId);
    if (!draft) return;
    printDraft(draft);
    console.log("\n--- Kelola Draft ---");
    console.log("1. Tambah pick");
    console.log("2. Hapus pick");
    console.log("3. Cek komposisi tim");
    console.log("0. Kembali");
    const sub = await ask("Pilih: ");

    switch (sub) {
      case "1": {
        printHeroes();
        const teamInput = await ask("Tim (1 = sendiri, 2 = lawan): ");
        const teamKey = teamInput === "1" ? "Blue" : teamInput === "2" ? "Red" : null;
        if (!teamKey) {
          console.log("Pilihan tim tidak valid.");
          break;
        }
        const heroId = await askNumber("ID hero yang dipilih: ");
        if (!heroId) console.log("ID tidak valid.");
        else {
          const result = draftApi.addPick(draft.id, teamKey, heroId);
          console.log(result.ok ? `${result.pick.heroName} berhasil dipilih.` : result.message);
        }
        break;
      }
      case "2": {
        const teamInput = await ask("Tim (1 = sendiri, 2 = lawan): ");
        const teamKey = teamInput === "1" ? "Blue" : teamInput === "2" ? "Red" : null;
        if (!teamKey) {
          console.log("Pilihan tim tidak valid.");
          break;
        }
        const heroId = await askNumber("ID hero yang dihapus dari draft: ");
        if (!heroId) console.log("ID tidak valid.");
        else {
          const result = draftApi.removePick(draft.id, teamKey, heroId);
          console.log(result.ok ? "Pick dihapus." : result.message);
        }
        break;
      }
      case "3": {
        for (const [key, label] of [["Blue", "Tim sendiri"], ["Red", "Tim lawan"]]) {
          const team = draft.teams?.[key] ?? [];
          const v = draftApi.validateTeam(team) ?? {};
          console.log(`\n${label}: ${v.count ?? team.length}/5 hero`);
          console.log(`Lane belum terisi: ${(v.missingLanes ?? []).join(", ") || "tidak ada"}`);
          if ((v.unassigned ?? []).length) console.log(`Hero bentrok lane: ${v.unassigned.join(", ")}`);
          console.log(v.validCount ? "Komposisi lengkap." : "Komposisi belum lengkap atau ada lane yang bentrok.");
        }
        await pause();
        break;
      }
      case "0":
        return;
      default:
        console.log("Pilihan tidak valid.");
    }
  }
}

async function draftMenu() {
  while (true) {
    console.log("\n=== DRAFT MANAGER ===");
    console.log("1. Lihat semua draft");
    console.log("2. Buat draft");
    console.log("3. Buka / kelola draft");
    console.log("4. Ubah nama draft");
    console.log("5. Hapus draft");
    console.log("0. Kembali");
    const choice = await ask("Pilih: ");

    switch (choice) {
      case "1": {
        const drafts = draftApi.allDrafts() ?? [];
        if (!drafts.length) console.log("Belum ada draft.");
        else drafts.forEach(d => printDraft(d));
        await pause();
        break;
      }
      case "2": {
        const name = await ask("Nama draft: ");
        const result = draftApi.createDraft(name);
        console.log(result.ok ? `Draft dibuat dengan ID ${result.draft.id}.` : result.message);
        await pause();
        break;
      }
      case "3": {
        const draft = await chooseDraft();
        if (!draft) {
          await pause();
          break;
        }
        await manageDraft(draft.id);
        break;
      }
      case "4": {
        const draft = await chooseDraft();
        if (draft) {
          const name = await ask("Nama baru: ");
          const result = draftApi.updateDraftName(draft.id, name);
          console.log(result.ok ? "Nama draft berhasil diubah." : result.message);
        }
        await pause();
        break;
      }
      case "5": {
        const draft = await chooseDraft();
        if (draft) {
          const confirm = await ask(`Hapus draft "${draft.name}"? (y/n): `);
          if (confirm.toLowerCase() === "y") {
            const result = draftApi.deleteDraft(draft.id);
            console.log(result.ok ? "Draft berhasil dihapus." : result.message);
          }
        }
        await pause();
        break;
      }
      case "0":
        return;
      default:
        console.log("Pilihan tidak valid.");
        break;
    }
  }
}

async function main() {
  console.log("==================================");
  console.log("      MLBB DRAFT PICK MANAGER");
  console.log("==================================");
  while (true) {
    console.log("\nMENU UTAMA");
    console.log("1. Manajemen hero (CRUD)");
    console.log("2. Draft manager");
    console.log("3. Lihat ringkasan data");
    console.log("0. Keluar");
    const choice = await ask("Pilih menu: ");
    if (choice === "1") await heroMenu();
    else if (choice === "2") await draftMenu();
    else if (choice === "3") {
      const heroes = heroesApi.allHeroes() ?? [];
      const drafts = draftApi.allDrafts() ?? [];
      console.log(`Jumlah hero : ${heroes.length}`);
      console.log(`Jumlah draft: ${drafts.length}`);
      console.log(`Hero tersedia: ${heroes.map(h => h.name).join(", ")}`);
      await pause();
    } else if (choice === "0") break;
    else console.log("Pilihan tidak valid.");
  }
  rl.close();
  console.log("Aplikasi ditutup.");
}

main().catch(error => {
  console.error("Terjadi kesalahan:", error.stack);
  rl.close();
  process.exitCode = 1;
});
