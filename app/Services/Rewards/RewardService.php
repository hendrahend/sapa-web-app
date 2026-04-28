<?php

namespace App\Services\Rewards;

use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\Student;
use App\Models\User;
use App\Models\XpEvent;
use App\Services\Xp\XpService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RewardService
{
    public function __construct(private readonly XpService $xp) {}

    /**
     * Request a redemption. Locks the XP cost immediately by writing a
     * negative XpEvent so the student cannot double-spend while admin
     * decides. If the redemption is later rejected, refundFor() is called.
     */
    public function requestRedemption(Student $student, Reward $reward, ?string $notes = null): RewardRedemption
    {
        if (! $reward->is_active) {
            throw new RuntimeException('Reward sedang tidak aktif.');
        }

        if (! $reward->inStock()) {
            throw new RuntimeException('Stok reward habis.');
        }

        $balance = $this->xp->totalFor($student);

        if ($balance < $reward->xp_cost) {
            throw new RuntimeException('XP tidak cukup untuk menukar reward ini.');
        }

        return DB::transaction(function () use ($student, $reward, $notes) {
            $redemption = RewardRedemption::query()->create([
                'student_id' => $student->id,
                'reward_id' => $reward->id,
                'xp_spent' => $reward->xp_cost,
                'status' => RewardRedemption::STATUS_PENDING,
                'notes' => $notes,
                'requested_at' => now(),
            ]);

            // Lock the cost immediately as a negative XP event.
            XpEvent::query()->create([
                'student_id' => $student->id,
                'source' => 'reward_redemption',
                'source_id' => $redemption->id,
                'points' => -$reward->xp_cost,
                'reason' => 'Tukar reward: '.$reward->name,
                'awarded_at' => Carbon::now(),
            ]);

            // Decrement stock if not unlimited.
            if (! $reward->isUnlimited()) {
                $reward->decrement('stock');
            }

            return $redemption->fresh(['reward', 'student']);
        });
    }

    public function approve(RewardRedemption $redemption, User $admin, ?string $adminNotes = null): RewardRedemption
    {
        if ($redemption->status !== RewardRedemption::STATUS_PENDING) {
            throw new RuntimeException('Hanya pengajuan pending yang dapat disetujui.');
        }

        $redemption->update([
            'status' => RewardRedemption::STATUS_APPROVED,
            'admin_notes' => $adminNotes,
            'decided_at' => now(),
            'decided_by' => $admin->id,
        ]);

        return $redemption->fresh(['reward', 'student']);
    }

    public function reject(RewardRedemption $redemption, User $admin, ?string $adminNotes = null): RewardRedemption
    {
        if (! in_array($redemption->status, [RewardRedemption::STATUS_PENDING, RewardRedemption::STATUS_APPROVED], true)) {
            throw new RuntimeException('Pengajuan tidak dapat ditolak pada status saat ini.');
        }

        return DB::transaction(function () use ($redemption, $admin, $adminNotes) {
            // Refund XP via a positive XpEvent.
            XpEvent::query()->create([
                'student_id' => $redemption->student_id,
                'source' => 'reward_refund',
                'source_id' => $redemption->id,
                'points' => $redemption->xp_spent,
                'reason' => 'Refund reward (ditolak): '.$redemption->reward?->name,
                'awarded_at' => Carbon::now(),
            ]);

            // Restore stock if not unlimited.
            if ($redemption->reward && ! $redemption->reward->isUnlimited()) {
                $redemption->reward->increment('stock');
            }

            $redemption->update([
                'status' => RewardRedemption::STATUS_REJECTED,
                'admin_notes' => $adminNotes,
                'decided_at' => now(),
                'decided_by' => $admin->id,
            ]);

            return $redemption->fresh(['reward', 'student']);
        });
    }

    public function deliver(RewardRedemption $redemption, User $admin, ?string $adminNotes = null): RewardRedemption
    {
        if ($redemption->status !== RewardRedemption::STATUS_APPROVED) {
            throw new RuntimeException('Hanya pengajuan yang sudah disetujui yang dapat ditandai diserahkan.');
        }

        $redemption->update([
            'status' => RewardRedemption::STATUS_DELIVERED,
            'admin_notes' => $adminNotes ?? $redemption->admin_notes,
            'decided_at' => now(),
            'decided_by' => $admin->id,
        ]);

        return $redemption->fresh(['reward', 'student']);
    }
}
