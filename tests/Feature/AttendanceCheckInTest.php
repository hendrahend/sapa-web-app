<?php

use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Enums\UserRole;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\SchoolLocation;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function createAttendanceCheckInContext(): array
{
    $user = User::factory()->create();
    $user->assignRole(UserRole::Student->value);

    $schoolClass = SchoolClass::create([
        'name' => 'X IPA 1',
        'grade_level' => '10',
        'academic_year' => '2026/2027',
        'is_active' => true,
    ]);

    $schoolLocation = SchoolLocation::create([
        'name' => 'Gedung Utama',
        'address' => 'Jl. Pendidikan',
        'latitude' => -6.2000000,
        'longitude' => 106.8166660,
        'radius_meters' => 100,
        'is_active' => true,
    ]);

    $student = Student::create([
        'user_id' => $user->id,
        'school_class_id' => $schoolClass->id,
        'nis' => '12345',
        'name' => 'Siswa Demo',
        'is_active' => true,
    ]);

    $session = AttendanceSession::create([
        'school_class_id' => $schoolClass->id,
        'school_location_id' => $schoolLocation->id,
        'title' => 'Absensi pagi',
        'attendance_date' => now()->toDateString(),
        'starts_at' => '06:30',
        'late_after' => '07:00',
        'ends_at' => '08:00',
        'status' => 'open',
    ]);

    return compact('user', 'student', 'session');
}

function validCheckInPayload(AttendanceSession $session): array
{
    return [
        'attendance_session_id' => $session->id,
        'latitude' => -6.2000000,
        'longitude' => 106.8166660,
        'location_accuracy_meters' => 20,
        'selfie' => UploadedFile::fake()->image('selfie.jpg'),
    ];
}

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);
    Storage::fake('public');
});

test('student can check in for an open attendance session', function () {
    $context = createAttendanceCheckInContext();

    $this->actingAs($context['user'])
        ->post(route('attendance.check-in.store'), validCheckInPayload($context['session']))
        ->assertRedirect(route('attendance.index'));

    $record = AttendanceRecord::query()->firstOrFail();

    expect($record->attendance_session_id)->toBe($context['session']->id)
        ->and($record->student_id)->toBe($context['student']->id)
        ->and($record->status)->toBe(AttendanceStatus::Present)
        ->and($record->verification_status)->toBe(AttendanceVerificationStatus::Approved);
});

test('student cannot check in twice for the same attendance session', function () {
    $context = createAttendanceCheckInContext();

    $record = AttendanceRecord::create([
        'attendance_session_id' => $context['session']->id,
        'student_id' => $context['student']->id,
        'status' => AttendanceStatus::Present->value,
        'checked_in_at' => now()->subMinutes(10),
        'latitude' => -6.2000000,
        'longitude' => 106.8166660,
        'location_accuracy_meters' => 10,
        'distance_from_school_meters' => 0,
        'is_within_radius' => true,
        'selfie_path' => 'attendance-selfies/original.jpg',
        'verification_status' => AttendanceVerificationStatus::Approved->value,
    ]);
    $originalCheckedInAt = $record->checked_in_at?->toISOString();

    $this->actingAs($context['user'])
        ->from(route('attendance.index'))
        ->post(route('attendance.check-in.store'), validCheckInPayload($context['session']))
        ->assertRedirect(route('attendance.index'))
        ->assertSessionHasErrors('attendance_session_id');

    expect(AttendanceRecord::query()->count())->toBe(1);

    $record->refresh();

    expect($record->selfie_path)->toBe('attendance-selfies/original.jpg')
        ->and($record->checked_in_at?->toISOString())->toBe($originalCheckedInAt);
});
