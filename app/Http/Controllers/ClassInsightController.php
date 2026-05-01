<?php

namespace App\Http\Controllers;

use App\Enums\SystemPermission;
use App\Models\ClassInsight;
use App\Models\SchoolClass;
use App\Services\Insights\ClassInsightService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassInsightController extends Controller
{
    public function index(Request $request): Response
    {
        $classes = SchoolClass::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level']);

        $selectedClassId = $request->integer('class') ?: $classes->first()?->id;

        $insights = ClassInsight::query()
            ->when($selectedClassId, fn ($q) => $q->where('school_class_id', $selectedClassId))
            ->with('schoolClass:id,name,grade_level', 'generator:id,name')
            ->orderByDesc('generated_at')
            ->limit(20)
            ->get()
            ->map(fn (ClassInsight $i) => [
                'id' => $i->id,
                'class' => $i->schoolClass?->only(['id', 'name', 'grade_level']),
                'period_start' => $i->period_start?->toDateString(),
                'period_end' => $i->period_end?->toDateString(),
                'metrics' => $i->metrics,
                'summary' => $i->summary,
                'highlights' => $i->highlights ?? [],
                'at_risk_students' => $i->at_risk_students ?? [],
                'recommendations' => $i->recommendations ?? [],
                'generated_at' => optional($i->generated_at)->toIso8601String(),
                'generator' => $i->generator?->only(['id', 'name']),
            ]);

        return Inertia::render('class-insights/index', [
            'classes' => $classes,
            'selectedClassId' => $selectedClassId,
            'insights' => $insights,
            'aiEnabled' => filled(config('services.groq.key')),
        ]);
    }

    public function store(Request $request, ClassInsightService $service): RedirectResponse
    {
        abort_unless(
            ($request->user()?->can(SystemPermission::CreateGrades->value) ?? false)
                || ($request->user()?->can(SystemPermission::UpdateGrades->value) ?? false),
            403,
        );

        $data = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
        ]);

        $class = SchoolClass::query()->findOrFail($data['school_class_id']);

        $service->generate(
            $class,
            triggeredBy: $request->user(),
            notifyTeachers: true,
        );

        $this->successToast("Insight kelas {$class->name} berhasil di-generate.");

        return back();
    }
}
