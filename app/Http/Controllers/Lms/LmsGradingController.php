<?php

namespace App\Http\Controllers\Lms;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\LmsSubmission;
use App\Services\Groq\GroqChatService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LmsGradingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->can(SystemPermission::CreateLms->value), 403);

        $tab = $request->string('tab')->toString() ?: 'pending';
        if (! in_array($tab, ['pending', 'graded'], true)) {
            $tab = 'pending';
        }

        $query = LmsSubmission::query()
            ->with([
                'student:id,name,school_class_id',
                'student.schoolClass:id,name',
                'assignment:id,lms_course_id,title,instructions,max_score',
                'assignment.course:id,title,school_class_id',
                'grader:id,name',
            ])
            ->whereHas('assignment')
            ->whereNotNull('content')
            ->whereNotNull('submitted_at');

        if ($tab === 'pending') {
            $query->whereNull('graded_at');
        } else {
            $query->whereNotNull('graded_at');
        }

        $submissions = $query
            ->orderByDesc('submitted_at')
            ->limit(60)
            ->get()
            ->map(function (LmsSubmission $s) {
                $assignment = $s->assignment;
                $student = $s->student;

                return [
                    'id' => $s->id,
                    'content' => $s->content,
                    'submitted_at' => optional($s->submitted_at)->toIso8601String(),
                    'score' => $s->score !== null ? (float) $s->score : null,
                    'feedback' => $s->feedback,
                    'graded_at' => optional($s->graded_at)->toIso8601String(),
                    'graded_by' => $s->grader?->only(['id', 'name']),
                    'ai_grade_data' => $s->ai_grade_data,
                    'ai_graded_at' => optional($s->ai_graded_at)->toIso8601String(),
                    'student' => $student ? [
                        'id' => $student->id,
                        'name' => $student->name,
                        'class_name' => $student->schoolClass?->name,
                    ] : null,
                    'assignment' => $assignment ? [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'instructions' => $assignment->instructions,
                        'max_score' => $assignment->max_score,
                        'course_name' => $assignment->course?->title,
                    ] : null,
                ];
            });

        return Inertia::render('lms/grading', [
            'tab' => $tab,
            'submissions' => $submissions,
            'aiEnabled' => filled(config('services.groq.key')),
            'stats' => [
                'pending' => LmsSubmission::query()
                    ->whereHas('assignment')
                    ->whereNotNull('content')
                    ->whereNotNull('submitted_at')
                    ->whereNull('graded_at')
                    ->count(),
                'graded' => LmsSubmission::query()
                    ->whereHas('assignment')
                    ->whereNotNull('content')
                    ->whereNotNull('submitted_at')
                    ->whereNotNull('graded_at')
                    ->count(),
            ],
        ]);
    }

    public function aiGrade(Request $request, LmsSubmission $submission, GroqChatService $groq): JsonResponse
    {
        abort_unless($request->user()?->can(SystemPermission::CreateLms->value), 403);

        $submission->load('assignment');

        if (blank($submission->content)) {
            return response()->json([
                'message' => 'Tugas ini belum punya konten yang bisa dinilai.',
            ], 422);
        }

        $assignment = $submission->assignment;
        $maxScore = $assignment?->max_score ?? 100;

        $system = <<<'SYS'
Kamu adalah asisten guru di Indonesia yang membantu menilai esai siswa.
Tugasmu memberi DRAFT skor dan feedback yang adil, membangun, dan spesifik.
Selalu balas dalam JSON valid sesuai schema. Gunakan bahasa Indonesia.
Skor harus realistis dan konsisten dengan kualitas tulisan.
Feedback harus memuji yang baik DAN memberi saran konkret untuk perbaikan.
SYS;

        $user = sprintf(
            "Tugas: %s\n\nInstruksi tugas:\n%s\n\nSkor maksimum: %d\n\nJawaban siswa:\n%s\n\nBalas dalam JSON dengan struktur:\n%s",
            $assignment?->title ?? 'Tugas LMS',
            $assignment?->instructions ?? '(tidak ada instruksi)',
            $maxScore,
            $submission->content,
            <<<'JSON'
{
  "suggested_score": 0,
  "max_score": 100,
  "summary": "ringkasan satu kalimat tentang kualitas keseluruhan",
  "strengths": ["poin kekuatan 1", "poin kekuatan 2"],
  "improvements": ["saran perbaikan 1", "saran perbaikan 2"],
  "paragraph_feedback": [
    {"index": 1, "comment": "feedback untuk paragraf 1"},
    {"index": 2, "comment": "feedback untuk paragraf 2"}
  ],
  "overall_feedback": "feedback gabungan yang siap diberikan ke siswa"
}
JSON
        );

        try {
            $result = $groq->askJson($system, $user, 2500);
        } catch (RequestException) {
            return response()->json(['message' => 'AI belum bisa dihubungi. Coba lagi sebentar.'], 502);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $result['max_score'] = $maxScore;
        $result['generated_at'] = now()->toIso8601String();

        $submission->forceFill([
            'ai_grade_data' => $result,
            'ai_graded_at' => now(),
        ])->save();

        return response()->json(['ai_grade_data' => $result]);
    }

    public function update(Request $request, LmsSubmission $submission): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::CreateLms->value), 403);

        $submission->load('assignment');
        $maxScore = $submission->assignment?->max_score ?? 100;

        $data = $request->validate([
            'score' => ['required', 'numeric', 'min:0', 'max:'.$maxScore],
            'feedback' => ['nullable', 'string', 'max:5000'],
        ]);

        $submission->forceFill([
            'score' => $data['score'],
            'feedback' => $data['feedback'] ?? null,
            'graded_by_id' => $request->user()?->id,
            'graded_at' => now(),
        ])->save();

        $this->successToast('Nilai tugas tersimpan.');

        return back();
    }
}
