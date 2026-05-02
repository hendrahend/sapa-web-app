<?php

use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);
    Storage::fake('public');
});

function makeLmsCourse(): LmsCourse
{
    $teacher = User::factory()->create();
    $teacher->assignRole('guru');

    $subject = Subject::query()->create([
        'name' => 'Bahasa Indonesia',
        'code' => 'BIN',
        'is_active' => true,
    ]);

    $schoolClass = SchoolClass::query()->create([
        'name' => 'X RPL 1',
        'is_active' => true,
    ]);

    return LmsCourse::query()->create([
        'subject_id' => $subject->id,
        'school_class_id' => $schoolClass->id,
        'teacher_id' => $teacher->id,
        'title' => 'Ruang belajar',
        'is_active' => true,
    ]);
}

test('teacher can add material with attachment', function () {
    $course = makeLmsCourse();
    $teacher = User::factory()->create();
    $teacher->assignRole('guru');
    $file = UploadedFile::fake()->create('materi.pdf', 128, 'application/pdf');

    $this->actingAs($teacher)
        ->post('/lms/materials', [
            'lms_course_id' => $course->id,
            'title' => 'Materi file',
            'content' => '',
            'attachment' => $file,
            'publish_now' => true,
        ])
        ->assertRedirect(route('lms.index'));

    $material = LmsMaterial::query()->latest('id')->first();

    expect($material)->not->toBeNull()
        ->and($material->attachment_name)->toBe('materi.pdf')
        ->and($material->attachment_path)->not->toBeNull();

    Storage::disk('public')->assertExists($material->attachment_path);
});

test('student can submit assignment with attachment', function () {
    $course = makeLmsCourse();
    $user = User::factory()->create();
    $user->assignRole('siswa');

    $student = Student::query()->create([
        'user_id' => $user->id,
        'school_class_id' => $course->school_class_id,
        'name' => 'Siswa File',
        'is_active' => true,
    ]);

    $assignment = LmsAssignment::query()->create([
        'lms_course_id' => $course->id,
        'title' => 'Tugas file',
        'instructions' => 'Kumpulkan dokumen.',
        'max_score' => 100,
        'is_published' => true,
    ]);

    $file = UploadedFile::fake()->create('jawaban.docx', 64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    $this->actingAs($user)
        ->post("/lms/assignments/{$assignment->id}/submissions", [
            'content' => '',
            'attachment' => $file,
        ])
        ->assertRedirect(route('lms.index'));

    $submission = LmsSubmission::query()
        ->where('student_id', $student->id)
        ->where('lms_assignment_id', $assignment->id)
        ->first();

    expect($submission)->not->toBeNull()
        ->and($submission->attachment_name)->toBe('jawaban.docx')
        ->and($submission->submitted_at)->not->toBeNull();

    Storage::disk('public')->assertExists($submission->attachment_path);
});
