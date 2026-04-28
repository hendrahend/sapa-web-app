<?php

namespace App\Console\Commands;

use App\Models\SchoolClass;
use App\Services\Insights\ClassInsightService;
use Illuminate\Console\Command;
use Throwable;

class GenerateClassInsights extends Command
{
    protected $signature = 'sapa:generate-class-insights
                            {--class= : Generate hanya untuk kelas tertentu (ID)}
                            {--no-notify : Jangan kirim notifikasi ke guru}';

    protected $description = 'Generate AI weekly insight untuk setiap kelas aktif';

    public function handle(ClassInsightService $service): int
    {
        $query = SchoolClass::query()->where('is_active', true);

        if ($this->option('class')) {
            $query->where('id', (int) $this->option('class'));
        }

        $classes = $query->get();

        if ($classes->isEmpty()) {
            $this->warn('Tidak ada kelas aktif.');

            return self::SUCCESS;
        }

        $notify = ! $this->option('no-notify');

        foreach ($classes as $class) {
            $this->info("Generating insight untuk: {$class->name}");
            try {
                $insight = $service->generate($class, notifyTeachers: $notify);
                $this->line("  → insight #{$insight->id} tersimpan");
            } catch (Throwable $e) {
                $this->error('  Gagal: '.$e->getMessage());
            }
        }

        return self::SUCCESS;
    }
}
