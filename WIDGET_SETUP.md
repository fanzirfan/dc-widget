# Discord Developer Portal — Widget Config

Semua yang perlu lu klik di **Games > Widget > Content**, dengan surface **Widget Top**.

> ⚠️ **Baca bagian "LANGKAH 0" DULU.** Widget lu sekarang masih terikat ke data
> Roblox (`rank_level`, `lunar_points`, dst). Script baru **nggak ngirim** field
> itu, dan Discord **menghapus** field yang nggak dikirim. Jadi subtitle lu bakal
> kosong sampai lu unbind.

---

## LANGKAH 0 — Bersihkan binding lama (WAJIB)

Script baru mengirim 7 field ini saja:

`display_name`, `top_track`, `top_artist`, `top_album`, `total_listen`, `scrobble_count`, `attribution`

Di portal, **field yang nggak ada di daftar itu akan kosong**. Buka panel kanan,
pilih tiap field, lalu:

| Field lama | Action |
| --- | --- |
| Title → `display_name` | ✅ **Biarkan** (dipakai lagi) |
| Subtitle 1 / 2 / 3 | ❌ **Unbind** — atau isi fallback |
| Stat `rank_level`, `lunar_points`, `expeditions`, `achievements`, `leaderboard_rank`, `weekly_points` | ❌ **Unbind** |

Cara unbind: klik field → **Value Type** → ganti dari `User Data` ke `Custom String` → isi teks fallback. Itu bikin field tetap tampil dengan teks aman.

---

## Config per field

Semua field pakai **Value Type: `User Data`**, lalu isi **Data Field** dengan nama yang tepat.

### Title

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `display_name` |

### Subtitle 1, 2, 3

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `Custom String` |
| Content | bebas (mis. `—`) |

Kode gw nggak pernah ngirim subtitle, jadi jangan set ke `User Data`.

### Stat 1 — Top Track

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `top_track` |
| Fallback | ON → Custom String `—` |

### Stat 2 — Top Artist

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `top_artist` |
| Fallback | ON → Custom String `—` |

### Stat 3 — Top Album

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `top_album` |
| Fallback | ON → Custom String `—` |

### Stat 4 — Total Listening

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `total_listen` |
| Fallback | ON → Custom String `—` |

### Stat 5 — Scrobbles

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `scrobble_count` |
| Fallback | ON → Custom String `0` |

### Stat 6 — Credit

| Setting | Value |
| --- | --- |
| Presentation Type | `Text` |
| Value Type | `User Data` |
| Data Field | `attribution` |
| Fallback | ON → Custom String `Via Last.fm` |

> Last.fm mewajibkan kredit di app yang pakai API mereka. Field ini penuhi itu.

### Image

| Setting | Value |
| --- | --- |
| Value Type | `User Data` |
| Data Field | `cover_art` |
| Fallback | ON → Application Asset (gambar default) |

Script cuma ngirim `cover_art` kalau `WIDGET_IMAGE_URL` di `.env` terisi. Kalau kosong, fallback yang muncul.

---

## Sample Data (untuk preview)

Tab **Sample Data** di panel bawah — klik **Add Field** buat tiap key:

| Key | Type | Sample value |
| --- | --- | --- |
| `display_name` | string | `FanzIrfan` |
| `top_track` | string | `All Falls Down (feat. Juliander)` |
| `top_artist` | string | `Galantis` |
| `top_album` | string | `All Falls Down` |
| `total_listen` | string | `≈ 18 mnt` |
| `scrobble_count` | string | `5` |
| `attribution` | string | `Via Last.fm` |

Value ini **harus type string**, karena kode kita kirim `type: 1` untuk semua field.

---

## Sebelum Publish

1. Cek tab **Validation** — harus "No validation errors".
2. Klik **Save changes**.
3. Jalankan `npm run sync` sekali, lalu `Ctrl+R` Discord (config di-cache per session).

---

## Alternatif: Presentation Type `Number` / `Duration`

Portal punya 2 mode lain yang **nggak gw pakai**:

- `Number` → `1500` jadi `1.5K`
- `Duration` → angka(ms) jadi `6h 30m`

Keduanya cuma nerima `User Data` dengan field bertipe number (`type: 2`). Kode kita kirim string, makanya `Text` yang dipakai.

Kalau lu mau `total_listen` diformat Discord sendiri (`6h 30m`), ubah kode: kirim `type: 2` dengan nilai ms, lalu set Presentation Type = `Duration`. Keuntungannya: widget ikut format otomatis. Kerugiannya: prefix `≈` (penanda bahwa ini estimasi) ikut hilang.

**Rekomendasi: tetap `Text`.** Penanda `≈` itu jujur — angkanya overestimate karena scrobble nyala di tengah lagu.