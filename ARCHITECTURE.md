# SAPA — Architecture

Dokumen ini menjelaskan **domain model**, **permission matrix**, dan **alur kunci** SAPA. Bila kamu ingin memahami codebase dengan cepat, mulai dari sini.

---

## 1. Domain model

```
                         ┌────────────────────┐
                         │       User         │  (admin / teacher / student / parent)
                         └───┬────────┬───────┘
                             │        │
            HasOne           │        │ BelongsToMany (parent_student)
                             │        │
                       ┌─────▼─┐  ┌───▼──────┐
                       │Student│  │ Children │
                       └───┬───┘  └──────────┘
                           │
       ┌───────────────────┼─────────────────────────────────────┐
       │                   │                                     │
┌──────▼─────┐      ┌──────▼──────┐                       ┌──────▼──────┐
│ SchoolClass│      │AttendanceRec│  ←  AttendanceSession ←│SchoolLocation│ (geofence)
└──────┬─────┘      └─────────────┘                       └─────────────┘
       │
   ┌───▼────────┐
   │ LmsCourse  │  ─►  LmsMaterial
   │            │  ─►  LmsAssignment  ─►  LmsSubmission
   └────────────┘
       │
   ┌───▼────────────┐
   │GradeAssessment │  ─►  GradeScore
   └────────────────┘

XpEvent (polymorphic-ish): {student_id, source: attendance|grade|lms, source_id, points, awarded_at}
LmsAiMessage: {user_id, course_id?, role: user|assistant, content, created_at}
notifications (Laravel native): parent inbox
```

### Tabel inti & relasi penting

| Tabel | Kolom kunci | Catatan |
| --- | --- | --- |
| `users` | `id`, `name`, `email` | Punya 0..1 `students`, 0..N `children` (jika role parent) |
| `students` | `user_id`, `school_class_id`, `nis`, `nisn` | 1 user ↔ 1 student record |
| `parent_student` | `parent_user_id`, `student_id` | Many-to-many parent ↔ student |
| `school_classes` | `homeroom_teacher_id`, `name`, `grade_level`, `academic_year` | |
| `school_locations` | `latitude`, `longitude`, `radius_meters` | Sumber kebenaran geofence |
| `attendance_sessions` | `school_class_id`, `school_location_id`, `attendance_date`, `starts_at`, `late_after`, `ends_at`, `status` | Window absensi per kelas per hari |
| `attendance_records` | `student_id`, `session_id`, `selfie_path`, `latitude`, `longitude`, `is_within_radius`, `distance_from_school_meters`, `status` | Hasil check-in |
| `grade_assessments` | `subject_id`, `school_class_id`, `teacher_id`, `type`, `max_score`, `weight` | |
| `grade_scores` | `grade_assessment_id`, `student_id`, `score`, `feedback`, `graded_by_id` | |
| `lms_courses` | `subject_id`, `school_class_id`, `teacher_id` | Visible to a student only when `student.school_class_id` matches |
| `lms_materials` | `lms_course_id`, `published_at` | |
| `lms_assignments` | `lms_course_id`, `due_at`, `max_score`, `is_published` | Siswa hanya melihat `is_published=true` |
| `lms_submissions` | `lms_assignment_id`, `student_id`, `content`, `submitted_at`, `score`, `feedback`, `graded_at` | Siswa hanya bisa CRUD miliknya |
| `xp_events` | `student_id`, `source`, `source_id`, `points`, `reason`, `awarded_at` | Sumber kebenaran XP. Total = `SUM(points)`. |
| `lms_ai_messages` | `user_id`, `course_id`, `role`, `content` | Riwayat percakapan AI |
| `notifications` | (native Laravel) | Inbox orang tua / guru |

---

## 2. Permission matrix

Permission dideklarasikan di [`app/Enums/SystemPermission.php`](./app/Enums/SystemPermission.php) dan dipasang ke role di [`database/seeders/RoleAndPermissionSeeder.php`](./database/seeders/RoleAndPermissionSeeder.php).

| Permission | admin | teacher | student | parent |
| --- | :-: | :-: | :-: | :-: |
| `users.*` | ✓ | | | |
| `students.*` | ✓ | | | |
| `classes.*` | ✓ | | | |
| `roles.*` | ✓ | | | |
| `school_locations.*` | ✓ | | | |
| `attendance.view / create / update` | ✓ | ✓ | | |
| `attendance.own.view / create` | ✓ | | ✓ | |
| `grades.view` | ✓ | ✓ | ✓ | |
| `grades.create / update` | ✓ | ✓ | | |
| `lms.view` | ✓ | ✓ | ✓ | |
| `lms.create / update` | ✓ | ✓ | | |
| `lms.assignments.submit` | ✓ | | ✓ | |
| `xp.view` | ✓ | ✓ | ✓ | |
| `xp.create / update` | ✓ | ✓ | | |
| `children.view` | ✓ | | | ✓ |
| `notifications.view` | ✓ | ✓ | ✓ | ✓ |
| `notifications.create / update` | ✓ | ✓ | | |

Frontend sidebar (`components/app-sidebar.tsx`) menyembunyikan menu yang permission-nya tidak dimiliki user.

---

## 3. Alur kunci

### 3.1 Absensi (siswa check-in)

```
Student → POST /attendance/check-in
  body: { selfie (file), latitude, longitude, session_id }

AttendanceCheckInController::store
  → validate session is open & today
  → save selfie ke storage/app/public/attendance/
  → Geofence::isWithinRadius(lat, lng, school_location)
  → derive status: hadir | terlambat (kalau > late_after) | perlu_verifikasi (di luar radius)
  → AttendanceRecord::create(...)
  → AttendanceObserver::created
        ├─► XpService::award($record)        // +20 hadir / +10 terlambat
        └─► NotifyParentsOfAttendance        // queue → parent.database (+ optional mail)
```

### 3.2 Penilaian → notifikasi orang tua + XP

```
Teacher → POST /grades/scores
  GradeScoreController::store

GradeScoreObserver::saved
  ├─► XpService::award($score)              // +30 jika score >= 75
  └─► NotifyParentsOfGrade                   // queue
```

### 3.3 LMS AI

```
User → POST /lms/ai/chat { message, course_id? }
  LmsAiChatController::store
   → save user message ke lms_ai_messages
   → GroqChatService::ask(message, context = recent course materials + recent messages)
   → save assistant message
   → return { answer, history }
```

Tombol *"Ringkas materi ini"* / *"Buat 5 soal latihan"* / *"Generate rubrik"* hanya menyiapkan prompt yang sudah baku di FE — seluruh percakapan tetap melewati endpoint yang sama.

### 3.4 XP & level

- Total XP siswa = `SUM(xp_events.points)`.
- Level = `floor(total_xp / 160) + 1` (default `XpService::LEVEL_THRESHOLD`).
- Leaderboard: agregasi `student_id` dengan `SUM(points)` + join `students` + `school_classes`. Difilter scope `kelas` atau `sekolah`.
- Badge derived (tidak disimpan di DB) dihitung di `XpService::badgesFor($student)` berdasar pola event (mis. *"5 hari hadir tepat waktu berturut-turut"*).

---

## 4. Konvensi kode

- **Form requests** untuk semua POST/PUT/DELETE non-trivial — di `app/Http/Requests/...`.
- **Inertia render keys** mengikuti path TS: `Inertia::render('attendance/index', [...])`.
- **Wayfinder** dipakai untuk semua tautan/form di FE; hindari hardcode URL.
- **Permissions** dicek via middleware `permission:...` di `routes/web.php`, dan via `$user->can(...)` di controller bila granular.
- **Indonesian copy** di UI; English untuk identifier kode.

---

## 5. Yang sengaja TIDAK dilakukan (dan kenapa)

- **Belum** ada queue Redis / Horizon — `database` queue sudah cukup untuk demo dan tidak perlu infra eksternal.
- **Belum** ada streaming AI response — Groq cepat, latency p50 < 2s, jadi non-stream baik-baik saja.
- **Belum** ada FCM / WhatsApp Cloud API untuk push parent — channel `database` + `mail` sudah cukup. Dirancang agar penambahan channel hanya menyentuh `Notification` classes, bukan call site.
