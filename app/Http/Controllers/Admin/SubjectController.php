<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SubjectRequest;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $statusFilter = trim((string) $request->string('status'));
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min(100, $perPage));

        $subjects = Subject::query()
            ->withCount(['gradeAssessments', 'lmsCourses'])
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->when($statusFilter === 'active', fn ($query) => $query->where('is_active', true))
            ->when($statusFilter === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'description' => $subject->description,
                'is_active' => $subject->is_active,
                'grade_assessments_count' => $subject->grade_assessments_count,
                'lms_courses_count' => $subject->lms_courses_count,
            ]);

        return Inertia::render('admin/subjects/index', [
            'subjects' => $subjects,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
            'stats' => [
                'totalSubjects' => Subject::query()->count(),
                'activeSubjects' => Subject::query()->where('is_active', true)->count(),
                'usedInGrades' => Subject::query()->has('gradeAssessments')->count(),
                'usedInLms' => Subject::query()->has('lmsCourses')->count(),
            ],
        ]);
    }

    public function store(SubjectRequest $request): RedirectResponse
    {
        Subject::create($this->subjectData($request));

        $this->successToast('Mapel berhasil ditambahkan.');

        return to_route('admin.subjects.index');
    }

    public function update(SubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update($this->subjectData($request));

        $this->successToast('Mapel berhasil diperbarui.');

        return to_route('admin.subjects.index');
    }

    public function destroy(Request $request, Subject $subject): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::DeleteSubjects->value), 403);

        if ($subject->gradeAssessments()->exists() || $subject->lmsCourses()->exists()) {
            $this->errorToast('Mapel masih dipakai di Penilaian atau LMS. Nonaktifkan saja jika sudah tidak dipakai.');

            return back();
        }

        $subject->delete();

        $this->successToast('Mapel berhasil dihapus.');

        return to_route('admin.subjects.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function subjectData(SubjectRequest $request): array
    {
        $data = $request->safe()->only([
            'name',
            'code',
            'description',
            'is_active',
        ]);

        $data['code'] = filled($data['code'] ?? null)
            ? strtoupper((string) $data['code'])
            : null;

        return $data;
    }
}
