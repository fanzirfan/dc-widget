# AGENTS.md — dc-widget

Project ini **bukan bot Discord**. Dia one-shot script: ambil stats dari Last.fm,
tulis ke profile widget Discord, selesai. Nggak ada proses yang perlu hidup
terus, dan nggak ada yang perlu di-restart kalau crash.

## Kapan menjalankan

**Setiap 60 menit.**

Stats Last.fm nggak berubah cepat, dan Discord cuma nge-cache widget di sisi
klien. Menjalankan tiap menit cuma membuang quota API tanpa hasil yang kelihatan.

### Kalau pakai cron (Linux / Termux)

```cron
0 * * * * cd /path/ke/dc-widget && /data/data/com.termux/files/usr/bin/npm run sync >> ~/dc-widget.log 2>&1
```

Ganti `/path/ke/dc-widget` dengan path absolut project lu.

### Kalau pakai Hermes / scheduler internal

Jalankan command ini persis, dari **path project**:

```bash
npm run sync
```

Batas wajar: **tidak lebih dari 1× per 10 menit.** Kalau dijadwalkan lebih
sering, script tetap aman (nggak ada rate limit yang terlampaui), tapi Last.fm
tetap minta pemanggilnya untuk tidak melakukan request secara agresif.

### Kalau lu dipanggil manual

Jalankan `npm run sync`. Aman kapan pun — script ini read-only ke Last.fm dan
cuma menulis ke widget. Gagal di tengah jalan tidak merusak apa pun.

## Verifikasi berhasil

Output sukses selalu dua baris:

```
[dc-widget] pushed N fields to Discord profile widget
[dc-widget] https://www.last.fm/user/fanzirfan — N scrobbles, ≈ N mnt
```

Kalau yang muncul `[dc-widget] sync failed: ...` dengan exit code 1, berarti
gagal — **laporkan ke user, jangan diamkan**. Script ini tidak mungkin gagal
diam.

## Command yang tersedia

| Command | Fungsi |
| `npm run sync` | Tarik stats dari Last.fm, tulis ke widget. Command utama. |
| `npm install` | Hanya perlu kalau `node_modules` hilang atau `package.json` berubah. |

## Aturan

- **Jangan edit `.env`.** Isinya credential. Kalau ada variabel yang perlu
  ditambah, tanya user dulu.
- **Jangan commit `.env` atau `data/`.** Keduanya sudah di-ignore.
- **Jangan push `data/durations.json`.** Itu cache durasi lagu. Isinya bisa
  dibikin ulang otomatis, dan memperbaruinya ga perlu intervensi manual.
- **Kalau sync gagal**, cek urutan ini sebelum-touch kode:
  1. `node -v` — harus >= 20.6 (script pakai `--env-file`)
  2. Isi `.env` masih lengkap?
  3. `npm run sync` gagal dengan pesan apa persisnya? **Laporkan pesan itu.**
- **Jangan tambah dependency tanpa diminta.** Satu dependency saja pun
  (@discordjs/rest) sudah cukup; `node-fetch` sengaja dihapus karena Node 24
  sudah punya `fetch` bawaan.

## Kalau user minta "kenapa widget-nya nggak berubah?"

Kemungkinan penyebab, dari yang paling sering:

1. **Belum dijalankan.** Widget cuma berubah saat script jalan.
2. **Config portal belum di-save.** Perubahan di Developer Portal perlu
   "Save changes", dan Discord cache config per session → `Ctrl+R`.
3. **Data Field di portal tidak sama dengan `name` di payload.** Harus cocok
   persis, kalau tidak widget jatuh ke fallback.
4. **Data Last.fm-nya emang belum berubah** — scrobble terakhir masih yang
   tampil, karena widget di-cache.

## Konteks

- **Widget ini "no longer supported"** oleh Discord sejak Juli 2026 (widget
  eksperimen ditutup). Yang existing masih jalan, tapi tanpa jaminan. Kalau
  suatu saat endpoint-nya mati, stats pipeline-nya tetap berguna — yang rusak
  cuma `src/discord/profile.js`.
- **`PROVIDER_ISSUED_USER_ID` di `.env` harus `0`.** Itu identity key yang sudah
  menempel di akun user. Mengganti nilainya akan ditolak Discord dengan
  `400 — Provider user ID does not match existing identity record`. Jangan
  diubah.
- **`total_listen` itu estimasi**, bukan fakta. Dihitung dari
  `lifetime scrobbles × rata-rata durasi top track`, dan scrobble Last.fm nyala
  di tengah lagu — jadi lagu yang di-skip terhitung utuh. Prefix `≈` di widget
  sengaja ada untuk menandai itu. Jangan dihapus tanpa alasan.