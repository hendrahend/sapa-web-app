<?php

namespace Database\Seeders;

use App\Enums\AttendanceSessionStatus;
use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Enums\UserRole;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsSubmission;
use App\Models\SchoolClass;
use App\Models\SchoolLocation;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        // Force notifications to dispatch synchronously while seeding so the
        // demo inbox is populated immediately (instead of sitting on the queue).
        $previousQueue = config('queue.default');
        config(['queue.default' => 'sync']);

        try {
            $this->seed();
        } finally {
            config(['queue.default' => $previousQueue]);
        }
    }

    private function seed(): void
    {
        $faker = FakerFactory::create('id_ID');

        // ---------- Core demo users ----------
        $teacher = $this->user('Budi Santoso, S.Kom.', 'guru@sapa.test', UserRole::Teacher);
        $studentUser = $this->user('Andi Pratama', 'siswa@sapa.test', UserRole::Student);
        $parentUser = $this->user('Ibu Andi', 'orangtua@sapa.test', UserRole::Parent);

        // Extra teachers
        $teacherMath = $this->user('Sari Wulandari, M.Pd.', 'matematika@sapa.test', UserRole::Teacher);
        $teacherIndo = $this->user('Rendra Kusuma, S.S.', 'bindo@sapa.test', UserRole::Teacher);

        // ---------- School location ----------
        $location = SchoolLocation::updateOrCreate([
            'name' => 'SMK SAPA Jakarta',
        ], [
            'address' => 'Jl. Pendidikan No. 1, Jakarta',
            'latitude' => -6.2,
            'longitude' => 106.8166667,
            'radius_meters' => 100,
            'is_active' => true,
        ]);

        // ---------- Subjects ----------
        $subjects = collect([
            ['code' => 'PWEB', 'name' => 'Pemrograman Web', 'description' => 'Dasar pengembangan aplikasi web modern.'],
            ['code' => 'MTK', 'name' => 'Matematika', 'description' => 'Aljabar, geometri, statistika.'],
            ['code' => 'BIN', 'name' => 'Bahasa Indonesia', 'description' => 'Membaca, menulis, dan menyimak.'],
            ['code' => 'PKWU', 'name' => 'Prakarya & Kewirausahaan', 'description' => 'Ide bisnis dan praktik wirausaha.'],
        ])->map(fn ($s) => Subject::updateOrCreate(['code' => $s['code']], $s + ['is_active' => true]));

        $subjectByCode = $subjects->keyBy('code');

        // ---------- Classes ----------
        $classNames = [
            ['name' => 'X RPL 1', 'grade' => '10', 'homeroom' => $teacher],
            ['name' => 'X RPL 2', 'grade' => '10', 'homeroom' => $teacherMath],
            ['name' => 'X TKJ 1', 'grade' => '10', 'homeroom' => $teacherIndo],
        ];

        $classes = collect($classNames)->map(fn ($c) => SchoolClass::updateOrCreate([
            'name' => $c['name'],
            'academic_year' => '2025/2026',
        ], [
            'homeroom_teacher_id' => $c['homeroom']->id,
            'grade_level' => $c['grade'],
            'is_active' => true,
        ]));

        $primaryClass = $classes->first();

        // ---------- Featured student linked to demo siswa@sapa.test ----------
        $featured = Student::updateOrCreate(['nis' => 'SAPA-001'], [
            'user_id' => $studentUser->id,
            'school_class_id' => $primaryClass->id,
            'nisn' => '0000000001',
            'name' => $studentUser->name,
            'gender' => 'L',
            'birth_date' => '2010-01-15',
            'phone' => '081234567890',
            'is_active' => true,
        ]);
        $featured->parentUsers()->syncWithoutDetaching([$parentUser->id]);

        // ---------- Extra students per class ----------
        $genders = ['L', 'P'];
        foreach ($classes as $classIndex => $class) {
            $existing = Student::where('school_class_id', $class->id)->count();
            $needed = max(0, 10 - $existing);
            for ($i = 0; $i < $needed; $i++) {
                $gender = $genders[$i % 2];
                $name = $faker->name($gender === 'L' ? 'male' : 'female');
                $studentEmail = Str::slug($name).'.'.$class->id.$i.'@sapa.test';
                $u = $this->user($name, $studentEmail, UserRole::Student);
                Student::updateOrCreate(['nis' => sprintf('SAPA-%02d%03d', $classIndex + 1, $i + 10)], [
                    'user_id' => $u->id,
                    'school_class_id' => $class->id,
                    'nisn' => str_pad((string) ($classIndex * 100 + $i + 10), 10, '0', STR_PAD_LEFT),
                    'name' => $name,
                    'gender' => $gender,
                    'birth_date' => $faker->dateTimeBetween('-17 years', '-15 years')->format('Y-m-d'),
                    'phone' => $faker->phoneNumber(),
                    'is_active' => true,
                ]);
            }
        }

        // ---------- Past 7 days of attendance per class ----------
        foreach ($classes as $class) {
            $students = Student::where('school_class_id', $class->id)->get();

            for ($daysAgo = 6; $daysAgo >= 0; $daysAgo--) {
                $date = now()->subDays($daysAgo);
                $isToday = $daysAgo === 0;

                $session = AttendanceSession::updateOrCreate([
                    'school_class_id' => $class->id,
                    'attendance_date' => $date->toDateString(),
                    'title' => 'Absensi pagi',
                ], [
                    'school_location_id' => $location->id,
                    'created_by_id' => $teacher->id,
                    'starts_at' => '07:00',
                    'late_after' => '07:15',
                    'ends_at' => '08:00',
                    'status' => $isToday
                        ? AttendanceSessionStatus::Open->value
                        : AttendanceSessionStatus::Closed->value,
                    'notes' => null,
                ]);

                foreach ($students as $i => $st) {
                    // Past days: every student gets a record. Today: only some students for the demo.
                    if ($isToday && $st->id !== $featured->id && $i % 3 !== 0) {
                        continue;
                    }

                    $rand = $faker->numberBetween(1, 100);
                    if ($rand <= 65) {
                        $status = AttendanceStatus::Present->value;
                        $checkedAt = $date->copy()->setTime(7, $faker->numberBetween(0, 14));
                    } elseif ($rand <= 80) {
                        $status = AttendanceStatus::Late->value;
                        $checkedAt = $date->copy()->setTime(7, $faker->numberBetween(16, 45));
                    } elseif ($rand <= 90) {
                        $status = AttendanceStatus::Sick->value;
                        $checkedAt = $date->copy()->setTime(7, 0);
                    } elseif ($rand <= 95) {
                        $status = AttendanceStatus::Excused->value;
                        $checkedAt = $date->copy()->setTime(7, 0);
                    } else {
                        $status = AttendanceStatus::Absent->value;
                        $checkedAt = $date->copy()->setTime(7, 0);
                    }

                    $isWithin = $status === AttendanceStatus::Absent->value ? false : ($faker->numberBetween(1, 100) > 5);
                    $distance = $isWithin
                        ? $faker->numberBetween(5, 80)
                        : $faker->numberBetween(120, 600);

                    AttendanceRecord::updateOrCreate([
                        'attendance_session_id' => $session->id,
                        'student_id' => $st->id,
                    ], [
                        'status' => $status,
                        'checked_in_at' => $checkedAt,
                        'latitude' => -6.2 + ($faker->numberBetween(-50, 50) / 10000),
                        'longitude' => 106.8166667 + ($faker->numberBetween(-50, 50) / 10000),
                        'location_accuracy_meters' => $faker->numberBetween(5, 25),
                        'distance_from_school_meters' => $distance,
                        'is_within_radius' => $isWithin,
                        'selfie_path' => null,
                        'verification_status' => $isWithin
                            ? AttendanceVerificationStatus::Approved->value
                            : AttendanceVerificationStatus::Pending->value,
                    ]);
                }
            }
        }

        // ---------- Assessments + scores ----------
        $assessmentTemplates = [
            ['code' => 'PWEB', 'title' => 'Tugas landing page', 'type' => 'tugas', 'weight' => 15],
            ['code' => 'PWEB', 'title' => 'UTS Pemrograman Web', 'type' => 'uts', 'weight' => 25],
            ['code' => 'MTK', 'title' => 'Kuis aljabar', 'type' => 'kuis', 'weight' => 10],
            ['code' => 'BIN', 'title' => 'Esai pengalaman pribadi', 'type' => 'tugas', 'weight' => 15],
        ];

        foreach ($classes as $class) {
            foreach ($assessmentTemplates as $tpl) {
                $subject = $subjectByCode[$tpl['code']];
                $assessment = GradeAssessment::updateOrCreate([
                    'subject_id' => $subject->id,
                    'school_class_id' => $class->id,
                    'title' => $tpl['title'],
                ], [
                    'teacher_id' => $teacher->id,
                    'type' => $tpl['type'],
                    'assessment_date' => now()->subDays($faker->numberBetween(1, 14))->toDateString(),
                    'max_score' => 100,
                    'weight' => $tpl['weight'],
                    'description' => 'Penilaian demo SAPA.',
                ]);

                foreach ($class->students as $st) {
                    if ($faker->boolean(80)) {
                        GradeScore::updateOrCreate([
                            'grade_assessment_id' => $assessment->id,
                            'student_id' => $st->id,
                        ], [
                            'graded_by_id' => $teacher->id,
                            'score' => $faker->numberBetween(60, 99),
                            'feedback' => $faker->randomElement([
                                'Bagus, pertahankan.',
                                'Perlu lebih teliti pada bagian pemecahan masalah.',
                                'Argumentasi sudah kuat, lanjutkan.',
                                'Coba kerjakan latihan tambahan minggu depan.',
                            ]),
                            'graded_at' => now()->subDays($faker->numberBetween(0, 7)),
                        ]);
                    }
                }
            }
        }

        // ---------- LMS courses + materials + assignments + submissions ----------
        foreach ($classes as $class) {
            $course = LmsCourse::updateOrCreate([
                'subject_id' => $subjectByCode['PWEB']->id,
                'school_class_id' => $class->id,
                'title' => 'Pemrograman Web — '.$class->name,
            ], [
                'teacher_id' => $teacher->id,
                'description' => 'Materi HTML, CSS, React, dan praktik membangun aplikasi sekolah.',
                'is_active' => true,
            ]);

            LmsMaterial::updateOrCreate([
                'lms_course_id' => $course->id,
                'title' => 'Pengantar komponen UI',
            ], [
                'content' => 'Komponen UI membantu halaman lebih konsisten, mudah dirawat, dan nyaman digunakan di perangkat sekolah. Pelajari struktur header, sidebar, dan card.',
                'published_at' => now()->subDays(5),
            ]);

            LmsMaterial::updateOrCreate([
                'lms_course_id' => $course->id,
                'title' => 'Form & validasi sederhana',
            ], [
                'content' => 'Form HTML, atribut required, dan validasi di sisi client memberi pengalaman yang ramah pengguna sebelum data dikirim ke server.',
                'published_at' => now()->subDays(2),
            ]);

            $assignment = LmsAssignment::updateOrCreate([
                'lms_course_id' => $course->id,
                'title' => 'Membuat kartu profil siswa',
            ], [
                'instructions' => 'Buat komponen kartu profil siswa yang menampilkan nama, kelas, status absensi, dan ringkasan XP.',
                'due_at' => now()->addWeek(),
                'max_score' => 100,
                'is_published' => true,
            ]);

            // Submissions: half submitted, some graded
            foreach ($class->students as $i => $st) {
                if ($i % 4 === 0) {
                    continue; // not submitted yet
                }

                $graded = $i % 3 === 0;
                LmsSubmission::updateOrCreate([
                    'lms_assignment_id' => $assignment->id,
                    'student_id' => $st->id,
                ], [
                    'content' => 'Berikut tautan repositori dan tangkapan layar saya.',
                    'submitted_at' => now()->subDays($faker->numberBetween(0, 3)),
                    'graded_by_id' => $graded ? $teacher->id : null,
                    'score' => $graded ? $faker->numberBetween(70, 95) : null,
                    'feedback' => $graded ? 'Implementasi rapi, perhatikan responsiveness.' : null,
                    'graded_at' => $graded ? now() : null,
                ]);
            }
        }
    }

    private function user(string $name, string $email, UserRole $role): User
    {
        $user = User::updateOrCreate([
            'email' => $email,
        ], [
            'name' => $name,
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);

        $user->syncRoles([$role->value]);

        return $user;
    }
}
