<?php

use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\SchoolClassController;
use App\Http\Controllers\Admin\SchoolLocationController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Attendance\AttendanceCheckInController;
use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\AttendanceSessionController;
use App\Http\Controllers\ClassInsightController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Exports\AttendanceExportController;
use App\Http\Controllers\Exports\GradeExportController;
use App\Http\Controllers\Grades\GradeAssessmentController;
use App\Http\Controllers\Grades\GradeController;
use App\Http\Controllers\Grades\GradeScoreController;
use App\Http\Controllers\Lms\LmsAiChatController;
use App\Http\Controllers\Lms\LmsAiToolsController;
use App\Http\Controllers\Lms\LmsAssignmentController;
use App\Http\Controllers\Lms\LmsController;
use App\Http\Controllers\Lms\LmsCourseController;
use App\Http\Controllers\Lms\LmsGradingController;
use App\Http\Controllers\Lms\LmsMaterialController;
use App\Http\Controllers\Lms\LmsSubmissionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Rewards\RewardController;
use App\Http\Controllers\XpController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('attendance', [AttendanceController::class, 'index'])
        ->middleware('permission:attendance.view|attendance.own.view')
        ->name('attendance.index');

    Route::resource('attendance/sessions', AttendanceSessionController::class)
        ->only('store')
        ->names('attendance.sessions')
        ->middleware('permission:attendance.create');

    Route::post('attendance/check-in', [AttendanceCheckInController::class, 'store'])
        ->middleware('permission:attendance.own.create')
        ->name('attendance.check-in.store');

    Route::get('grades', [GradeController::class, 'index'])
        ->middleware('permission:grades.view')
        ->name('grades.index');

    Route::get('grades/export', GradeExportController::class)
        ->middleware('permission:grades.view')
        ->name('grades.export');

    Route::get('attendance/export', AttendanceExportController::class)
        ->middleware('permission:attendance.view')
        ->name('attendance.export');

    Route::resource('grades/assessments', GradeAssessmentController::class)
        ->only('store')
        ->names('grades.assessments')
        ->middleware('permission:grades.create');

    Route::resource('grades/scores', GradeScoreController::class)
        ->only('store')
        ->names('grades.scores')
        ->middleware('permission:grades.create|grades.update');

    Route::get('lms', [LmsController::class, 'index'])
        ->middleware('permission:lms.view')
        ->name('lms.index');

    Route::get('class-insights', [ClassInsightController::class, 'index'])
        ->middleware('permission:grades.view')
        ->name('class-insights.index');

    Route::post('class-insights', [ClassInsightController::class, 'store'])
        ->middleware('permission:grades.create|grades.update')
        ->name('class-insights.store');

    Route::resource('lms/ai/chat', LmsAiChatController::class)
        ->only(['index', 'store'])
        ->names('lms.ai.chat')
        ->middleware('permission:lms.view');

    Route::get('lms/ai/tools', [LmsAiToolsController::class, 'index'])
        ->middleware('permission:lms.create')
        ->name('lms.ai.tools');

    Route::post('lms/ai/tools/rubrik', [LmsAiToolsController::class, 'rubrik'])
        ->middleware('permission:lms.create')
        ->name('lms.ai.tools.rubrik');

    Route::post('lms/ai/tools/soal', [LmsAiToolsController::class, 'soal'])
        ->middleware('permission:lms.create')
        ->name('lms.ai.tools.soal');

    Route::get('lms/grading', [LmsGradingController::class, 'index'])
        ->middleware('permission:lms.create')
        ->name('lms.grading.index');

    Route::post('lms/grading/{submission}/ai', [LmsGradingController::class, 'aiGrade'])
        ->middleware('permission:lms.create')
        ->name('lms.grading.ai');

    Route::patch('lms/grading/{submission}', [LmsGradingController::class, 'update'])
        ->middleware('permission:lms.create')
        ->name('lms.grading.update');

    Route::resource('lms/courses', LmsCourseController::class)
        ->only('store')
        ->names('lms.courses')
        ->middleware('permission:lms.create');

    Route::resource('lms/materials', LmsMaterialController::class)
        ->only('store')
        ->names('lms.materials')
        ->middleware('permission:lms.create');

    Route::resource('lms/assignments', LmsAssignmentController::class)
        ->only('store')
        ->names('lms.assignments')
        ->middleware('permission:lms.create');

    Route::resource('lms/assignments.submissions', LmsSubmissionController::class)
        ->only('store')
        ->names('lms.assignments.submissions')
        ->middleware('permission:lms.assignments.submit');

    Route::get('xp', [XpController::class, 'index'])
        ->middleware('permission:xp.view')
        ->name('xp.index');

    Route::get('notifications', [NotificationController::class, 'index'])
        ->middleware('permission:notifications.view')
        ->name('notifications.index');

    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])
        ->middleware('permission:notifications.view')
        ->name('notifications.read');

    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->middleware('permission:notifications.view')
        ->name('notifications.read-all');

    Route::resource('admin/users', UserController::class)
        ->only(['index', 'store', 'destroy'])
        ->names('admin.users')
        ->middlewareFor('index', 'permission:users.view')
        ->middlewareFor('store', 'permission:users.create')
        ->middlewareFor('destroy', 'permission:users.delete');

    Route::resource('admin/students', StudentController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('admin.students')
        ->middlewareFor('index', 'permission:students.view')
        ->middlewareFor('store', 'permission:students.create')
        ->middlewareFor('update', 'permission:students.update')
        ->middlewareFor('destroy', 'permission:students.delete');

    Route::resource('admin/classes', SchoolClassController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['classes' => 'schoolClass'])
        ->names('admin.classes')
        ->middlewareFor('index', 'permission:classes.view')
        ->middlewareFor('store', 'permission:classes.create')
        ->middlewareFor('update', 'permission:classes.update')
        ->middlewareFor('destroy', 'permission:classes.delete');

    Route::resource('admin/roles', RolePermissionController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('admin.roles')
        ->middlewareFor('index', 'permission:roles.view')
        ->middlewareFor('store', 'permission:roles.create')
        ->middlewareFor('update', 'permission:roles.update')
        ->middlewareFor('destroy', 'permission:roles.delete');

    Route::resource('admin/school-location', SchoolLocationController::class)
        ->only(['index', 'store'])
        ->names('admin.school-location')
        ->middlewareFor('index', 'permission:school_locations.view')
        ->middlewareFor('store', 'permission:school_locations.create|school_locations.update');

    Route::get('rewards', [RewardController::class, 'index'])
        ->middleware('permission:rewards.view')
        ->name('rewards.index');

    Route::post('rewards/{reward}/redeem', [RewardController::class, 'store'])
        ->middleware('permission:rewards.redeem')
        ->name('rewards.redeem');

    Route::get('admin/rewards', [RewardController::class, 'adminIndex'])
        ->middleware('permission:rewards.manage')
        ->name('admin.rewards.index');

    Route::post('admin/rewards', [RewardController::class, 'adminStore'])
        ->middleware('permission:rewards.manage')
        ->name('admin.rewards.store');

    Route::patch('admin/rewards/{reward}', [RewardController::class, 'adminUpdate'])
        ->middleware('permission:rewards.manage')
        ->name('admin.rewards.update');

    Route::delete('admin/rewards/{reward}', [RewardController::class, 'adminDestroy'])
        ->middleware('permission:rewards.manage')
        ->name('admin.rewards.destroy');

    Route::patch('admin/rewards/redemptions/{redemption}', [RewardController::class, 'adminDecide'])
        ->middleware('permission:rewards.manage')
        ->name('admin.rewards.redemptions.decide');
});

require __DIR__.'/settings.php';
