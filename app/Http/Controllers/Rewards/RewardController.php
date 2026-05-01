<?php

namespace App\Http\Controllers\Rewards;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Services\Rewards\RewardService;
use App\Services\Xp\XpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class RewardController extends Controller
{
    public function index(Request $request, XpService $xp): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();

        $balance = $student ? $xp->totalFor($student) : 0;

        $rewards = Reward::query()
            ->where('is_active', true)
            ->orderBy('xp_cost')
            ->orderBy('id')
            ->get(['id', 'name', 'description', 'image_url', 'xp_cost', 'stock'])
            ->map(fn (Reward $reward) => [
                'id' => $reward->id,
                'name' => $reward->name,
                'description' => $reward->description,
                'image_url' => $reward->image_url,
                'xp_cost' => $reward->xp_cost,
                'stock' => $reward->stock,
                'unlimited' => $reward->isUnlimited(),
                'in_stock' => $reward->inStock(),
            ])
            ->values();

        $redemptions = $student
            ? RewardRedemption::query()
                ->with('reward:id,name,xp_cost,image_url')
                ->where('student_id', $student->id)
                ->latest('requested_at')
                ->latest('id')
                ->limit(20)
                ->get()
                ->map(fn (RewardRedemption $r) => [
                    'id' => $r->id,
                    'reward' => $r->reward ? [
                        'id' => $r->reward->id,
                        'name' => $r->reward->name,
                        'image_url' => $r->reward->image_url,
                    ] : null,
                    'xp_spent' => $r->xp_spent,
                    'status' => $r->status,
                    'notes' => $r->notes,
                    'admin_notes' => $r->admin_notes,
                    'requested_at' => optional($r->requested_at)->toIso8601String(),
                    'decided_at' => optional($r->decided_at)->toIso8601String(),
                ])
                ->values()
            : collect();

        return Inertia::render('rewards/index', [
            'student' => $student ? [
                'id' => $student->id,
                'name' => $student->name,
                'class_name' => $student->schoolClass?->name,
            ] : null,
            'balance' => $balance,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'canRedeem' => $user?->can(SystemPermission::RedeemRewards->value) ?? false,
        ]);
    }

    public function store(Request $request, Reward $reward, RewardService $service): RedirectResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $student = $user?->student;

        if (! $student) {
            return back()->with('error', 'Akun ini bukan akun siswa.');
        }

        if (! $user->can(SystemPermission::RedeemRewards->value)) {
            return back()->with('error', 'Anda tidak dapat menukar reward.');
        }

        try {
            $service->requestRedemption($student, $reward, $request->input('notes'));
        } catch (RuntimeException $e) {
            return back()->withErrors(['notes' => $e->getMessage()]);
        }

        return redirect()
            ->route('xp.index', ['tab' => 'rewards'])
            ->with('success', 'Pengajuan reward berhasil. Tunggu persetujuan admin/guru.');
    }

    public function adminIndex(Request $request): Response
    {
        abort_unless($request->user()?->can(SystemPermission::ManageRewards->value), 403);

        $rewards = Reward::query()
            ->withCount('redemptions')
            ->orderByDesc('is_active')
            ->orderBy('xp_cost')
            ->orderBy('id')
            ->get();

        $redemptions = RewardRedemption::query()
            ->with(['reward:id,name,xp_cost,image_url', 'student:id,name,school_class_id', 'student.schoolClass:id,name', 'decidedBy:id,name'])
            ->latest('requested_at')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (RewardRedemption $r) => [
                'id' => $r->id,
                'reward' => $r->reward ? [
                    'id' => $r->reward->id,
                    'name' => $r->reward->name,
                    'xp_cost' => $r->reward->xp_cost,
                ] : null,
                'student' => $r->student ? [
                    'id' => $r->student->id,
                    'name' => $r->student->name,
                    'class_name' => $r->student->schoolClass?->name,
                ] : null,
                'xp_spent' => $r->xp_spent,
                'status' => $r->status,
                'notes' => $r->notes,
                'admin_notes' => $r->admin_notes,
                'requested_at' => optional($r->requested_at)->toIso8601String(),
                'decided_at' => optional($r->decided_at)->toIso8601String(),
                'decided_by' => $r->decidedBy ? ['id' => $r->decidedBy->id, 'name' => $r->decidedBy->name] : null,
            ])
            ->values();

        return Inertia::render('admin/rewards/index', [
            'rewards' => $rewards->map(fn (Reward $reward) => [
                'id' => $reward->id,
                'name' => $reward->name,
                'description' => $reward->description,
                'image_url' => $reward->image_url,
                'xp_cost' => $reward->xp_cost,
                'stock' => $reward->stock,
                'unlimited' => $reward->isUnlimited(),
                'is_active' => $reward->is_active,
                'redemptions_count' => $reward->redemptions_count,
            ])->values(),
            'redemptions' => $redemptions,
            'stats' => [
                'pending' => RewardRedemption::query()->where('status', RewardRedemption::STATUS_PENDING)->count(),
                'approved' => RewardRedemption::query()->where('status', RewardRedemption::STATUS_APPROVED)->count(),
                'delivered' => RewardRedemption::query()->where('status', RewardRedemption::STATUS_DELIVERED)->count(),
                'rejected' => RewardRedemption::query()->where('status', RewardRedemption::STATUS_REJECTED)->count(),
            ],
        ]);
    }

    public function adminStore(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::ManageRewards->value), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'xp_cost' => ['required', 'integer', 'min:1', 'max:100000'],
            'stock' => ['required', 'integer', 'min:-1', 'max:100000'],
            'is_active' => ['required', 'boolean'],
        ]);

        Reward::query()->create([
            ...$data,
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Reward berhasil dibuat.');
    }

    public function adminUpdate(Request $request, Reward $reward): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::ManageRewards->value), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'xp_cost' => ['required', 'integer', 'min:1', 'max:100000'],
            'stock' => ['required', 'integer', 'min:-1', 'max:100000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $reward->update($data);

        return back()->with('success', 'Reward berhasil diperbarui.');
    }

    public function adminDestroy(Request $request, Reward $reward): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::ManageRewards->value), 403);

        if ($reward->redemptions()->exists()) {
            return back()->withErrors(['reward' => 'Reward tidak dapat dihapus karena sudah pernah ditukar siswa. Nonaktifkan saja.']);
        }

        $reward->delete();

        return back()->with('success', 'Reward dihapus.');
    }

    public function adminDecide(Request $request, RewardRedemption $redemption, RewardService $service): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::ManageRewards->value), 403);

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'deliver'])],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();

        try {
            match ($data['action']) {
                'approve' => $service->approve($redemption, $admin, $data['admin_notes'] ?? null),
                'reject' => $service->reject($redemption, $admin, $data['admin_notes'] ?? null),
                'deliver' => $service->deliver($redemption, $admin, $data['admin_notes'] ?? null),
            };
        } catch (RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with('success', 'Pengajuan diperbarui.');
    }
}
