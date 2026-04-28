<?php

namespace App\Providers;

use App\Models\AttendanceRecord;
use App\Models\GradeScore;
use App\Models\LmsSubmission;
use App\Observers\AttendanceRecordObserver;
use App\Observers\GradeScoreObserver;
use App\Observers\LmsSubmissionObserver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerObservers();
    }

    protected function registerObservers(): void
    {
        AttendanceRecord::observe(AttendanceRecordObserver::class);
        GradeScore::observe(GradeScoreObserver::class);
        LmsSubmission::observe(LmsSubmissionObserver::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
