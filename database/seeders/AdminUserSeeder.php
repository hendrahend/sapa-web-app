<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the first administrator account.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate([
            'email' => 'admin@sapa.test',
        ], [
            'name' => 'Admin SAPA',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);

        $admin->syncRoles([UserRole::Admin->value]);
    }
}
