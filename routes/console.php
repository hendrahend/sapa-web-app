<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('sapa:generate-class-insights')
    ->weeklyOn(1, '07:00') // Senin 07:00
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping();
