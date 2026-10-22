Penjelasan:

draftpick.js -> CRUD untuk manajemen draft pick

  REQUIRED LANES: 
    -Lima lane yang harus terisi dalam 1 tim.
    
  TEAM_KEYS = ["Blue", "Red"]
    -Blue adalah tim sendiri, Red adalah tim lawan.
    
  allDrafts()
    -Baca drafts.json
    -Masttin teams.Blue dan teams.Red ada.
    
  saveDrafts(drafts) 
    -menulis ke drafts.json.
    
  nextDraftId(drafts) Id terbesar + 1.
  createDraft(name)
    -Membuat objek berisi id, name, createdAt, dan teams.
    -Draft di-push, disimpan, lalu dikembalikan.
    
  findDraftId()
    -mencari suatu draft dengan Id.
    
  addPick(draftId, teamKey, heroId)
    -teamKey harus Blue atau Red.
    -Draft harus ada.
    -Hero harus ada.
    -Tim itu belum penuh (maksimal 5).
    
  pick(heroId, heroName, role, lanes) 
    -Pick dimasukkan ke tim, draft disimpan, lalu hasilnya dikembalikan. 
    -Pick menyimpan salinan nama dan role supaya draft tetap terbaca walau hero kemudian diubah atau dihapus.
    
  removePick(draftId, teamKey, heroId)
    -Memeriksa draft dan tim.
    -Mencatat jumlah pick sebelumnya, lalu memfilter pick dengan heroId.
    -Jika jumlah tidak berubah, pick tidak ada di tim itu dan mengembalikan error. Kalau berubah, maka pick akan disimpan.
    
  updateDraftName(id, name)
    -Mencari draft, memeriksa nama baru agar tidak kosong, mengganti draft.name, lalu meyimpan nama baru nya.
    
  deleteDraft(id)
    -Mencari draft, lalu menyimpan array tanpa draft itu.
    
  validateTeam(picks)
    -Mengecek apakah 5 hero bisa menempati 5 lane yang berbeda.
    -lanesPerPick
      -Untuk tiap pick, diambil dari daftar lane hero dari daftar terbaru (atau dari pick kalau hero sudah dihapus), difilter ke REQUIRED_LANES.
    -laneOwner
      -Catatan lane -> pick mana yang menempati lane tersebut.
    -tryAssign(i, seen)
      -Memberi pick ke-i sebuah lane. Kalau lane itu kosong, bakal ditempatin. Kalo udah dipake pick lain, fungsi mencoba memindahkan pemilik lane ke lane lain (rekursif)
      -seen mencegah perulangan tak berujung.
    -missingLanes
      -Lane wajib yang belum ditempati siapapun dan harus diisi.
    -Hasilnya adalah objek: validCount (5 hero dan lane terisi), full (hero), missingLanes, unassigned, dan count.
    
  
heroes.js -> CRUD untuk manajemen hero 

  ROLES:
    -Enam roles para hero.
    
  LANES:
    -Lima lane yang harus terisi dalam 1 tim.

  DEFAULT_LANES:
    -Pasangan lane dan roles secara default.

  withLanes(hero)
    -Kalau hero punya lane yang ngga kosong, hero dikembalikan apa adanya.
    -Kalau belum, dibuat salinan hero (...hero) dengan lanes diisi dari DEFAULT_LANES[role].

  allHeroes()
    -Membaca heroes.json, lalu menjalankan withLanes ke setiap hero lewat (.map).

  saveHeroes(heroes)
    -Menulis array hero ke heroes.json.

  nextID(heroes)
    -Mencari ID terbesar lalu + 1.

  findHeroById(id)
    -Mencari hero dengan ID yang sama.

  matchIgnoreCase(value, list)
    -Mencari item di list yang sama dengan value tanpa membedakan huruf kecil dan besar.

  normalizeInput(input)
    -name: diubah ke string dan di-trim.
    -role: dicocokkan ke roles.
    -lanes: tiap lane dicocokkan ke lanes.

  validateHero(input, existingHeroes, ignoreID = null)
    -Nama kosong → “Nama hero wajib diisi.”
    -Nama sudah ada → “Nama hero sudah ada.”
    -Role tidak ada di ROLES → pesan error.
    -Lane bukan array, kosong, atau berisi lane tidak valid → pesan error.
    -Mengembalikan array error. Array kosong berarti valid.

  addHeroes(input)
    -Membaca semua hero, membuat objek baru dengan ID berikutnya.
    -Kalau errror mengembalikan { ok: false, errors }.
    -Kalau lolos, hero di-push dan mengembalikan { ok: true, hero }.

  updateHeroes(id, input)
    -Menggabungkan hero lama dengan hero baru dengan ID yang sama.

  deleteHeroes(id)
    -Array difilter tanpa hero itu lalu disimpan, dan hero yang dihapus dikembalikan.
  
main.js -> File utama buat ngejalanin semua fungsi nya

  printHeroes(heroes = heroesApi.allHeroes())
    -Parameter bawaannya semua hero. Argumen lain dipakai untuk hasil pencarian.
    -Mencetak hero.

  printHeroDetails(hero)
    -Mencetak detail satu hero (ID, nama, role, lane).

  getHeroInput(existing = {})
    -Dipakai untuk tambah dan ubah hero.
    -Mengembalikan {nama, roles, lanes}.

  heroMenu()
    -1 mencetak semua hero.
    -2 meminta kata kunci, lalu memfilter hero yang namanya mengandung kata itu (huruf kecil semua).
    -3 memanggil getHeroInput lalu addHeroes. Kalau berhasil nyetak pesan sukses, kalau tidak nyetak daftar error.
    -4 mencetak daftar, meminta ID, dan mencari hero. Kalau ketemu, ambil input baru dengan nilai lama sebagai bawaan lalu panggil updateHeroes(id, data).
    -5 meminta ID, lalu konfirmasi y/n sebelum deleteHeroes.
    -0 memakai return untuk keluar dari loop.
    -default menampilkan “Pilihan tidak valid.”

  printDraft(draft)
    -Mencetak judul draft.

  chooseDraft()
    -Mencetak ringkasan tiap draft, meminta ID, dan mengembalikan draft-nya. Kalau tidak ketemu, mengembalikan null.

  manageDraft(draftId)
    -1 menambah pick. Tim dipilih (1 → Blue, 2 → Red), lalu ID hero diminta, lalu addPick.
    -2 menghapus pick dengan pola input yang sama, lalu memanggil removePick.
    -3 menampilkan hasil validateTeam tiap tim: jumlah hero, lane kosong, hero yang bentrok, dan status komposisi.
    -0 kembali ke menu draft.

  draftMenu()
    -1 mencetak semua draft.
    -2 membuat draft dari nama yang diketik.
    -3 memilih draft lalu masuk ke manageDraft.
    -4 mengganti nama draft.
    -5 menghapus draft setelah konfirmasi.
    -0 kembali ke menu utama

storage.js -> File buat nyimpen fungsi baca, nulis, dan hapus file JSON

  ensureFile(fileName, defaultValue)
    -Menyusun path lengkap dengan path.join.
    -Mengembalikan path, jadi pemanggil pasti punya file yang valid. Ini sebabnya drafts.json bisa muncul sendiri pas pertama dipake.

  readJson(fileName, defaultValue = [])
    -Memanggil ensureFile, abis tu JSON.parse isi file.
    -Kalo JSON rusak, catch lempar error.

  writeJson(fileName, data)
    -Memastikan file ada, lalu menimpa seluruh isinya dengan data yang sudah di-stringify.

drafts.json -> File buat nyimpen data draft pick
heroes.json -> File buat nyimpen data hero
