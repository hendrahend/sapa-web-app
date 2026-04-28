<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', UserRole::Admin->value))
            ->first();

        $rewards = [
            [
                'name' => 'Bebas tugas 1×',
                'description' => 'Tukarkan untuk satu kali bebas tugas (kecuali ujian) — perlu konfirmasi guru kelas.',
                'xp_cost' => 200,
                'stock' => -1,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher snack kantin',
                'description' => 'Voucher diskon Rp 5.000 di kantin sekolah.',
                'xp_cost' => 120,
                'stock' => 50,
                'is_active' => true,
            ],
            [
                'name' => 'Sertifikat siswa berprestasi',
                'description' => 'Sertifikat resmi sekolah berformat PDF, dapat dicetak.',
                'xp_cost' => 350,
                'stock' => -1,
                'is_active' => true,
            ],
            [
                'name' => 'Stiker eksklusif SAPA',
                'description' => 'Set stiker SAPA limited edition.',
                'xp_cost' => 80,
                'stock' => 100,
                'is_active' => true,
            ],
            [
                'name' => 'Pulsa belajar Rp 10.000',
                'description' => 'Voucher kuota internet untuk belajar.',
                'xp_cost' => 500,
                'stock' => 20,
                'is_active' => true,
            ],
        ];

        foreach ($rewards as $data) {
            Reward::query()->updateOrCreate(
                ['name' => $data['name']],
                [...$data, 'created_by' => $admin?->id],
            );
        }
    }
}
