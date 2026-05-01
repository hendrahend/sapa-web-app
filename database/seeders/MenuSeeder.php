<?php

namespace Database\Seeders;

use App\Enums\SystemPermission;
use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $platform = $this->menu('Platform', null, [
            'order' => 10,
        ]);

        $admin = $this->menu('Admin', null, [
            'order' => 20,
        ]);

        $this->menu('Dashboard', $platform->id, [
            'route' => '/dashboard',
            'icon' => 'LayoutGrid',
            'order' => 10,
        ]);

        $this->menu('Absensi', $platform->id, [
            'route' => '/attendance',
            'icon' => 'ClipboardCheck',
            'permission_name' => $this->any(SystemPermission::ViewAttendance, SystemPermission::ViewOwnAttendance),
            'order' => 20,
        ]);

        $this->menuByRoute('/lms', $platform->id, [
            'title' => 'LMS',
            'icon' => 'BookOpen',
            'permission_name' => SystemPermission::ViewLms->value,
            'order' => 30,
        ]);

        $this->menuByRoute('/grades', $platform->id, [
            'title' => 'Penilaian',
            'icon' => 'GraduationCap',
            'permission_name' => SystemPermission::ViewGrades->value,
            'order' => 40,
        ]);

        $this->menuByRoute('/lms/ai/tools', $platform->id, [
            'title' => 'AI Tools',
            'icon' => 'Sparkles',
            'permission_name' => SystemPermission::CreateLms->value,
            'order' => 50,
            'is_visible' => false,
        ]);

        $this->menu('Insight Kelas', $platform->id, [
            'route' => '/class-insights',
            'icon' => 'BarChart3',
            'permission_name' => SystemPermission::ViewGrades->value,
            'order' => 60,
        ]);

        $this->menu('XP & Reward', $platform->id, [
            'route' => '/xp',
            'icon' => 'Award',
            'permission_name' => $this->any(SystemPermission::ViewXp, SystemPermission::ViewRewards),
            'order' => 70,
        ]);

        $this->menu('Notifikasi', $platform->id, [
            'route' => '/notifications',
            'icon' => 'Bell',
            'permission_name' => SystemPermission::ViewNotifications->value,
            'order' => 80,
        ]);

        $this->menu('Pengguna', $admin->id, [
            'route' => '/admin/users',
            'icon' => 'Users',
            'permission_name' => SystemPermission::ViewUsers->value,
            'order' => 10,
        ]);

        $this->menu('Siswa & Orang Tua', $admin->id, [
            'route' => '/admin/students',
            'icon' => 'IdCard',
            'permission_name' => SystemPermission::ViewStudents->value,
            'order' => 20,
        ]);

        $this->menu('Data Kelas', $admin->id, [
            'route' => '/admin/classes',
            'icon' => 'School',
            'permission_name' => SystemPermission::ViewClasses->value,
            'order' => 30,
        ]);

        $this->menu('Role & Permission', $admin->id, [
            'route' => '/admin/roles',
            'icon' => 'ShieldCheck',
            'permission_name' => SystemPermission::ViewRoles->value,
            'order' => 40,
        ]);

        $this->menu('Lokasi Sekolah', $admin->id, [
            'route' => '/admin/school-location',
            'icon' => 'MapPinned',
            'permission_name' => SystemPermission::ViewSchoolLocations->value,
            'order' => 50,
        ]);

        $this->menu('Kelola Reward', $admin->id, [
            'route' => '/admin/rewards',
            'icon' => 'Store',
            'permission_name' => SystemPermission::ManageRewards->value,
            'order' => 60,
        ]);

        $this->menuByTitle('Menu Manager', $admin->id, [
            'route' => '/admin/menus',
            'icon' => 'Menu',
            'permission_name' => SystemPermission::ViewMenus->value,
            'order' => 70,
        ]);

        Menu::query()
            ->where('title', 'Settings')
            ->whereNull('parent_id')
            ->update([
                'is_visible' => false,
                'is_active' => false,
            ]);

        $this->hiddenRoutes();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function menu(string $title, ?int $parentId, array $attributes): Menu
    {
        return Menu::query()->updateOrCreate([
            'title' => $title,
            'parent_id' => $parentId,
        ], [
            'route' => $attributes['route'] ?? null,
            'icon' => $attributes['icon'] ?? null,
            'permission_name' => $attributes['permission_name'] ?? null,
            'order' => $attributes['order'] ?? 0,
            'is_visible' => $attributes['is_visible'] ?? true,
            'is_active' => $attributes['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function menuByTitle(string $title, ?int $parentId, array $attributes): Menu
    {
        return Menu::query()->updateOrCreate([
            'title' => $title,
        ], [
            'parent_id' => $parentId,
            'route' => $attributes['route'] ?? null,
            'icon' => $attributes['icon'] ?? null,
            'permission_name' => $attributes['permission_name'] ?? null,
            'order' => $attributes['order'] ?? 0,
            'is_visible' => $attributes['is_visible'] ?? true,
            'is_active' => $attributes['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function menuByRoute(string $route, ?int $parentId, array $attributes): Menu
    {
        return Menu::query()->updateOrCreate([
            'route' => $route,
        ], [
            'parent_id' => $parentId,
            'title' => $attributes['title'],
            'icon' => $attributes['icon'] ?? null,
            'permission_name' => $attributes['permission_name'] ?? null,
            'order' => $attributes['order'] ?? 0,
            'is_visible' => $attributes['is_visible'] ?? true,
            'is_active' => $attributes['is_active'] ?? true,
        ]);
    }

    private function hiddenRoutes(): void
    {
        $routes = [
            ['/attendance/excuses', $this->any(SystemPermission::ViewAttendance, SystemPermission::ViewOwnAttendance)],
            ['/attendance/export', SystemPermission::ViewAttendance->value],
            ['/grades/export', SystemPermission::ViewGrades->value],
            ['/lms/ai/chat', SystemPermission::ViewLms->value],
            ['/lms/grading', SystemPermission::CreateLms->value],
            ['/rewards', SystemPermission::ViewRewards->value],
        ];

        foreach ($routes as [$route, $permission]) {
            $this->menu($route, null, [
                'route' => $route,
                'permission_name' => $permission,
                'is_visible' => false,
            ]);
        }
    }

    private function any(SystemPermission ...$permissions): string
    {
        return collect($permissions)
            ->map(fn (SystemPermission $permission) => $permission->value)
            ->implode('|');
    }
}
