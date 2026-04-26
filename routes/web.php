<?php

use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\SchoolClassController;
use App\Http\Controllers\Admin\SchoolLocationController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Attendance\AttendanceCheckInController;
use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\AttendanceSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Grades\GradeAssessmentController;
use App\Http\Controllers\Grades\GradeController;
use App\Http\Controllers\Grades\GradeScoreController;
use App\Http\Controllers\Lms\LmsAssignmentController;
use App\Http\Controllers\Lms\LmsController;
use App\Http\Controllers\Lms\LmsCourseController;
use App\Http\Controllers\Lms\LmsMaterialController;
use App\Http\Controllers\Lms\LmsSubmissionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('attendance', [AttendanceController::class, 'index'])
        ->middleware('permission:attendance.manage|attendance.view|attendance.own.view')
        ->name('attendance.index');

    Route::post('attendance/sessions', [AttendanceSessionController::class, 'store'])
        ->middleware('permission:attendance.manage')
        ->name('attendance.sessions.store');

    Route::post('attendance/check-in', [AttendanceCheckInController::class, 'store'])
        ->middleware('permission:attendance.own.view')
        ->name('attendance.check-in.store');

    Route::get('grades', [GradeController::class, 'index'])
        ->middleware('permission:grades.manage|grades.view')
        ->name('grades.index');

    Route::post('grades/assessments', [GradeAssessmentController::class, 'store'])
        ->middleware('permission:grades.manage')
        ->name('grades.assessments.store');

    Route::post('grades/scores', [GradeScoreController::class, 'store'])
        ->middleware('permission:grades.manage')
        ->name('grades.scores.store');

    Route::get('lms', [LmsController::class, 'index'])
        ->middleware('permission:lms.manage|lms.view')
        ->name('lms.index');

    Route::post('lms/courses', [LmsCourseController::class, 'store'])
        ->middleware('permission:lms.manage')
        ->name('lms.courses.store');

    Route::post('lms/materials', [LmsMaterialController::class, 'store'])
        ->middleware('permission:lms.manage')
        ->name('lms.materials.store');

    Route::post('lms/assignments', [LmsAssignmentController::class, 'store'])
        ->middleware('permission:lms.manage')
        ->name('lms.assignments.store');

    Route::post('lms/assignments/{assignment}/submissions', [LmsSubmissionController::class, 'store'])
        ->middleware('permission:lms.assignments.submit')
        ->name('lms.assignments.submissions.store');

    Route::inertia('xp', 'xp/index')
        ->middleware('permission:xp.manage|xp.view')
        ->name('xp.index');

    Route::inertia('notifications', 'notifications/index')
        ->middleware('permission:notifications.manage|notifications.view')
        ->name('notifications.index');

    Route::get('admin/users', [UserController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('admin.users.index');

    Route::get('admin/students', [StudentController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('admin.students.index');

    Route::post('admin/students', [StudentController::class, 'store'])
        ->middleware('permission:users.manage')
        ->name('admin.students.store');

    Route::put('admin/students/{student}', [StudentController::class, 'update'])
        ->middleware('permission:users.manage')
        ->name('admin.students.update');

    Route::get('admin/classes', [SchoolClassController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('admin.classes.index');

    Route::post('admin/classes', [SchoolClassController::class, 'store'])
        ->middleware('permission:users.manage')
        ->name('admin.classes.store');

    Route::put('admin/classes/{schoolClass}', [SchoolClassController::class, 'update'])
        ->middleware('permission:users.manage')
        ->name('admin.classes.update');

    Route::get('admin/roles', [RolePermissionController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('admin.roles.index');

    Route::get('admin/school-location', [SchoolLocationController::class, 'index'])
        ->middleware('permission:school_locations.manage')
        ->name('admin.school-location.index');

    Route::put('admin/school-location', [SchoolLocationController::class, 'store'])
        ->middleware('permission:school_locations.manage')
        ->name('admin.school-location.store');
});

require __DIR__.'/settings.php';
