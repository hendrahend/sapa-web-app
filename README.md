# SAPA — Sistem Absensi & Penilaian

> Platform sekolah satu pintu untuk **absensi**, **penilaian**, **LMS dengan asisten AI**, **gamifikasi XP**, dan **notifikasi orang tua** — dibangun untuk tema *Transformasi Digital dalam Pendidikan*.

SAPA membantu guru dan sekolah memindahkan rutinitas harian (absensi pagi, penilaian, materi & tugas, kabar untuk orang tua) ke satu sistem web yang aman, cepat, dan mudah dipakai dari ponsel siswa.

---

## Fitur utama

| Modul | Yang bisa dilakukan |
| --- | --- |
| **Absensi** | Siswa check-in dengan **foto selfie** + **GPS radius** (geofence), guru memantau status hadir / terlambat / perlu verifikasi per kelas, per hari. |
| **Penilaian** | Guru membuat assessment (tugas, kuis, praktik, UTS, UAS), memberi nilai dan feedback, siswa melihat rekap nilainya sendiri. |
| **LMS** | Kursus → materi → tugas → submission. Siswa hanya melihat kursus kelasnya, tugas yang sudah dipublikasikan, dan submission miliknya sendiri. |
| **AI Assistant (Groq)** | Tombol *"Ringkas materi ini"*, *"Buat 5 soal latihan"*, *"Beri feedback"* memanggil Groq Llama untuk membantu guru & siswa, dengan riwayat percakapan tersimpan per pengguna. |
| **XP & Gamifikasi** | Setiap absensi tepat waktu, nilai bagus, dan tugas LMS yang diselesaikan menambah XP. Level otomatis, badge derived (mis. *"Tepat waktu 5x berturut-turut"*), dan leaderboard kelas + sekolah. |
| **Notifikasi Orang Tua** | Saat anak hadir / terlambat / tidak hadir, atau saat guru merilis nilai, orang tua menerima notifikasi di inbox SAPA (dan opsional e-mail). |
| **RBAC** | Role siap pakai: `admin`, `teacher`, `student`, `parent` — dengan permission matrix yang konsisten dipakai di backend (`spatie/laravel-permission`) dan frontend nav. |
| **2FA** | TOTP + recovery codes via Laravel Fortify. |

---

## Akun demo

Setelah `php artisan db:seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@sapa.test` | `password` |
| Guru | `guru@sapa.test` | `password` |
| Siswa | `siswa@sapa.test` | `password` |
| Orang tua | `orangtua@sapa.test` | `password` |

Seeder mengisi 3 kelas, ~30 siswa, beberapa hari riwayat absensi, kursus LMS, tugas yang sebagian sudah dinilai dan sebagian masih perlu feedback — siap untuk demo.

---

## Stack teknologi

- **Backend** — PHP 8.3 / Laravel 13, SQLite (default) / MySQL / Postgres
- **Frontend** — React 18 + TypeScript, Inertia.js, Tailwind CSS, shadcn/ui
- **Routing** — Laravel + [Wayfinder](https://github.com/laravel/wayfinder) (typed FE routes)
- **Auth** — Laravel Fortify (2FA, recovery codes)
- **RBAC** — `spatie/laravel-permission`
- **AI** — [Groq](https://groq.com) (`llama-3.1-8b-instant` default, configurable)
- **Notifications** — Laravel native database notifications (queued), opsional channel `mail`
- **Tests** — Pest 4
- **Lint / format** — Pint, ESLint, Prettier, `tsc --noEmit`

---

## Setup lokal

Prasyarat: PHP 8.3+, Composer, Node 20+, npm.

```bash
git clone https://github.com/hanskasep/sapa-web-app.git
cd sapa-web-app
composer setup
```

`composer setup` akan:

1. `composer install`
2. menyalin `.env.example` → `.env` jika belum ada
3. `php artisan key:generate`
4. `php artisan migrate --force`
5. `php artisan db:seed --force`
6. `php artisan wayfinder:generate --with-form`
7. `npm install`
8. `npm run build`

Set `GROQ_API_KEY` di `.env` jika ingin menguji asisten AI (gratis di [console.groq.com](https://console.groq.com/keys)).

### Menjalankan dev server

```bash
composer dev
```

Membuka 4 proses paralel: `php artisan serve`, queue listener, `php artisan pail` (log live), dan `npm run dev` (Vite). Aplikasi tersedia di **http://localhost:8000**.

---

## Skrip yang sering dipakai

| Perintah | Apa yang dilakukan |
| --- | --- |
| `composer dev` | Dev server + queue + log + Vite |
| `composer test` | Lint check + Pest |
| `composer lint` | `pint --parallel` |
| `npm run lint` | ESLint dengan `--fix` |
| `npm run format` | Prettier write |
| `npm run types:check` | `tsc --noEmit` |
| `php artisan migrate:fresh --seed` | Reset DB + isi ulang demo data |
| `php artisan wayfinder:generate --with-form` | Regen typed routes (otomatis saat `npm run dev`) |

---

## Struktur folder ringkas

```
app/
  Enums/                # AttendanceStatus, SystemPermission, UserRole, ...
  Http/Controllers/
    Admin/              # Users, Students, Classes, Roles, SchoolLocations
    Attendance/         # Sessions + selfie/GPS check-in
    Grades/             # Assessments, scores
    Lms/                # Courses, materials, assignments, submissions, AI chat
  Models/
  Notifications/        # AttendanceRecordedForChild, GradeReleasedForChild
  Observers/            # AttendanceRecord, GradeScore, LmsSubmission → XP + parent notifs
  Services/
    Groq/GroqChatService.php
    Xp/XpService.php
  Support/Geofence.php
database/
  migrations/           # users, permissions, attendance, grades, LMS, xp_events, lms_ai_messages
  seeders/              # Roles, Admin, Demo data
resources/js/
  pages/                # welcome, dashboard, attendance, grades, lms, xp, notifications, admin/*
  components/sapa/      # ModulePage, school-location-map, dst.
  components/ui/        # shadcn/ui primitives
routes/
  web.php
  settings.php
```

Diagram domain & permission matrix lengkap ada di [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Lisensi

MIT. Dibuat untuk tantangan *Transformasi Digital dalam Pendidikan*.
