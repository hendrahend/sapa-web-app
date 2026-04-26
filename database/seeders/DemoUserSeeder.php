<?php

namespace Database\Seeders;

use App\Enums\AttendanceSessionStatus;
use App\Enums\UserRole;
use App\Models\AttendanceSession;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\SchoolClass;
use App\Models\SchoolLocation;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * Seed demo users for each SAPA role.
     */
    public function run(): void
    {
        $teacher = $this->user(
            name: 'Guru SAPA',
            email: 'guru@sapa.test',
            role: UserRole::Teacher,
        );

        $studentUser = $this->user(
            name: 'Siswa SAPA',
            email: 'siswa@sapa.test',
            role: UserRole::Student,
        );

        $parentUser = $this->user(
            name: 'Orang Tua SAPA',
            email: 'orangtua@sapa.test',
            role: UserRole::Parent,
        );

        $schoolClass = SchoolClass::updateOrCreate([
            'name' => 'X RPL 1',
            'academic_year' => '2025/2026',
        ], [
            'homeroom_teacher_id' => $teacher->id,
            'grade_level' => '10',
            'is_active' => true,
        ]);

        $student = Student::updateOrCreate([
            'nis' => 'SAPA-001',
        ], [
            'user_id' => $studentUser->id,
            'school_class_id' => $schoolClass->id,
            'nisn' => '0000000001',
            'name' => $studentUser->name,
            'gender' => 'L',
            'birth_date' => '2010-01-01',
            'phone' => '081234567890',
            'is_active' => true,
        ]);

        $schoolLocation = SchoolLocation::updateOrCreate([
            'name' => 'Lokasi Utama',
        ], [
            'address' => 'Alamat sekolah belum diatur',
            'latitude' => -6.2,
            'longitude' => 106.8166667,
            'radius_meters' => 100,
            'is_active' => true,
        ]);

        AttendanceSession::updateOrCreate([
            'school_class_id' => $schoolClass->id,
            'attendance_date' => now()->toDateString(),
            'title' => 'Absensi pagi',
        ], [
            'school_location_id' => $schoolLocation->id,
            'created_by_id' => $teacher->id,
            'starts_at' => '07:00',
            'late_after' => '07:15',
            'ends_at' => '08:00',
            'status' => AttendanceSessionStatus::Open->value,
            'notes' => 'Sesi demo untuk mencoba absensi selfie + radius.',
        ]);

        $student->user()->associate($studentUser)->save();
        $student->parentUsers()->syncWithoutDetaching([$parentUser->id]);

        $subject = Subject::updateOrCreate([
            'code' => 'PWEB',
        ], [
            'name' => 'Pemrograman Web',
            'description' => 'Dasar pengembangan aplikasi web modern.',
            'is_active' => true,
        ]);

        $assessment = GradeAssessment::updateOrCreate([
            'subject_id' => $subject->id,
            'school_class_id' => $schoolClass->id,
            'title' => 'Tugas landing page',
        ], [
            'teacher_id' => $teacher->id,
            'type' => 'tugas',
            'assessment_date' => now()->toDateString(),
            'max_score' => 100,
            'weight' => 15,
            'description' => 'Membuat landing page sekolah dengan komponen responsif.',
        ]);

        GradeScore::updateOrCreate([
            'grade_assessment_id' => $assessment->id,
            'student_id' => $student->id,
        ], [
            'graded_by_id' => $teacher->id,
            'score' => 88,
            'feedback' => 'Struktur halaman sudah rapi, lanjutkan optimasi aksesibilitas.',
            'graded_at' => now(),
        ]);

        $course = LmsCourse::updateOrCreate([
            'subject_id' => $subject->id,
            'school_class_id' => $schoolClass->id,
            'title' => 'Pemrograman Web Dasar',
        ], [
            'teacher_id' => $teacher->id,
            'description' => 'Materi HTML, CSS, React, dan praktik membangun aplikasi sekolah.',
            'is_active' => true,
        ]);

        LmsMaterial::updateOrCreate([
            'lms_course_id' => $course->id,
            'title' => 'Pengantar komponen UI',
        ], [
            'content' => 'Komponen UI membantu halaman lebih konsisten, mudah dirawat, dan nyaman digunakan di perangkat sekolah.',
            'published_at' => now(),
        ]);

        LmsAssignment::updateOrCreate([
            'lms_course_id' => $course->id,
            'title' => 'Membuat kartu profil siswa',
        ], [
            'instructions' => 'Buat komponen kartu profil siswa yang menampilkan nama, kelas, status absensi, dan ringkasan XP.',
            'due_at' => now()->addWeek(),
            'max_score' => 100,
            'is_published' => true,
        ]);
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
