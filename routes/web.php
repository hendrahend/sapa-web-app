<?php

use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\SchoolClassController;
use App\Http\Controllers\Admin\SchoolLocationController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Attendance\AttendanceCheckInController;
use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\AttendanceExcuseController;
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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified', 'menu.permission'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('attendance', AttendanceController::class)
        ->only('index');

    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::resource('sessions', AttendanceSessionController::class)
            ->only('store');

        Route::post('check-in', [AttendanceCheckInController::class, 'store'])
            ->name('check-in.store');

        Route::patch('records/{record}/verification', [AttendanceController::class, 'verifyRecord'])
            ->name('records.verify');

        Route::resource('excuses', AttendanceExcuseController::class)
            ->only(['index', 'store']);

        Route::patch('excuses/{excuse}', [AttendanceExcuseController::class, 'decide'])
            ->name('excuses.decide');

        Route::get('export', AttendanceExportController::class)
            ->name('export');
    });

    Route::resource('grades', GradeController::class)
        ->only('index');

    Route::prefix('grades')->name('grades.')->group(function () {
        Route::get('export', GradeExportController::class)
            ->name('export');

        Route::resource('assessments', GradeAssessmentController::class)
            ->only('store');

        Route::resource('scores', GradeScoreController::class)
            ->only('store');
    });

    Route::get('class-insights', [ClassInsightController::class, 'index'])
        ->name('class-insights.index');

    Route::post('class-insights', [ClassInsightController::class, 'store'])
        ->name('class-insights.store');

    Route::resource('lms', LmsController::class)
        ->only('index');

    Route::prefix('lms')->name('lms.')->group(function () {
        Route::prefix('ai')->name('ai.')->group(function () {
            Route::resource('chat', LmsAiChatController::class)
                ->only(['index', 'store']);

            Route::get('tools', [LmsAiToolsController::class, 'index'])
                ->name('tools');

            Route::post('tools/rubrik', [LmsAiToolsController::class, 'rubrik'])
                ->name('tools.rubrik');

            Route::post('tools/soal', [LmsAiToolsController::class, 'soal'])
                ->name('tools.soal');
        });

        Route::get('grading', fn (Request $request) => redirect()->route('grades.index', [
            'grade_tab' => 'lms',
            'lms_tab' => $request->string('tab')->toString() === 'graded' ? 'graded' : 'pending',
        ]))->name('grading.index');

        Route::post('grading/{submission}/ai', [LmsGradingController::class, 'aiGrade'])
            ->name('grading.ai');

        Route::patch('grading/{submission}', [LmsGradingController::class, 'update'])
            ->name('grading.update');

        Route::resource('courses', LmsCourseController::class)
            ->only('store');

        Route::resource('materials', LmsMaterialController::class)
            ->only('store');

        Route::resource('assignments', LmsAssignmentController::class)
            ->only('store');

        Route::resource('assignments.submissions', LmsSubmissionController::class)
            ->only('store');
    });

    Route::resource('xp', XpController::class)
        ->only('index');

    Route::resource('notifications', NotificationController::class)
        ->only('index');

    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.read');

    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->name('notifications.read-all');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('students', StudentController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('classes', SchoolClassController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['classes' => 'schoolClass']);

        Route::resource('subjects', SubjectController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('roles', RolePermissionController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('menus', MenuController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('school-location', SchoolLocationController::class)
            ->only(['index', 'store']);

        Route::get('rewards', [RewardController::class, 'adminIndex'])
            ->name('rewards.index');

        Route::post('rewards', [RewardController::class, 'adminStore'])
            ->name('rewards.store');

        Route::patch('rewards/{reward}', [RewardController::class, 'adminUpdate'])
            ->name('rewards.update');

        Route::delete('rewards/{reward}', [RewardController::class, 'adminDestroy'])
            ->name('rewards.destroy');

        Route::patch('rewards/redemptions/{redemption}', [RewardController::class, 'adminDecide'])
            ->name('rewards.redemptions.decide');
    });

    Route::get('rewards', fn () => redirect()->route('xp.index', ['tab' => 'rewards']))
        ->name('rewards.index');

    Route::post('rewards/{reward}/redeem', [RewardController::class, 'store'])
        ->name('rewards.redeem');
});

require __DIR__.'/settings.php';
