<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MenuRequest;
use App\Models\Menu;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class MenuController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can(SystemPermission::ViewMenus->value), 403);

        $menus = Menu::query()
            ->with('parent:id,title')
            ->orderBy('parent_id')
            ->orderBy('order')
            ->orderBy('title')
            ->get();

        return Inertia::render('admin/menus/index', [
            'menuItems' => $menus->map(fn (Menu $menu) => [
                'id' => $menu->id,
                'parent_id' => $menu->parent_id,
                'parent_title' => $menu->parent?->title,
                'title' => $menu->title,
                'route' => $menu->route,
                'icon' => $menu->icon,
                'permission_name' => $menu->permission_name,
                'order' => $menu->order,
                'is_visible' => $menu->is_visible,
                'is_active' => $menu->is_active,
            ]),
            'parents' => $menus
                ->map(fn (Menu $menu) => [
                    'id' => $menu->id,
                    'title' => $menu->title,
                ])
                ->values(),
            'permissions' => Permission::query()
                ->pluck('name')
                ->merge($menus->pluck('permission_name')->filter())
                ->unique()
                ->sort()
                ->values(),
            'stats' => [
                'totalMenus' => $menus->count(),
                'visibleMenus' => $menus->where('is_visible', true)->count(),
                'protectedMenus' => $menus->whereNotNull('permission_name')->count(),
            ],
        ]);
    }

    public function store(MenuRequest $request): RedirectResponse
    {
        $data = $this->menuData($request);

        Menu::query()->create($data);
        $this->ensurePermissions($data['permission_name'] ?? null);

        $this->successToast('Menu berhasil ditambahkan.');

        return to_route('admin.menus.index');
    }

    public function update(MenuRequest $request, Menu $menu): RedirectResponse
    {
        $data = $this->menuData($request);

        if ($this->isDescendant((int) ($data['parent_id'] ?? 0), $menu)) {
            throw ValidationException::withMessages([
                'parent_id' => 'Parent menu tidak boleh berada di bawah menu ini.',
            ]);
        }

        $menu->update($data);
        $this->ensurePermissions($data['permission_name'] ?? null);

        $this->successToast('Menu berhasil diperbarui.');

        return to_route('admin.menus.index');
    }

    public function destroy(Request $request, Menu $menu): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::DeleteMenus->value), 403);

        if ($menu->children()->exists()) {
            $this->errorToast('Menu masih memiliki child. Hapus atau pindahkan child menu terlebih dahulu.');

            return back();
        }

        $menu->delete();
        $this->successToast('Menu berhasil dihapus.');

        return to_route('admin.menus.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function menuData(MenuRequest $request): array
    {
        $data = $request->safe()->only([
            'parent_id',
            'title',
            'route',
            'icon',
            'permission_name',
            'order',
            'is_visible',
            'is_active',
        ]);

        $data['parent_id'] = $data['parent_id'] ? (int) $data['parent_id'] : null;
        $data['route'] = $this->normalizeRoute($data['route'] ?? null);
        $data['permission_name'] = filled($data['permission_name'] ?? null)
            ? trim((string) $data['permission_name'])
            : null;

        return $data;
    }

    private function normalizeRoute(?string $route): ?string
    {
        $route = trim((string) $route);

        if ($route === '' || $route === '#') {
            return null;
        }

        return str_starts_with($route, '/') ? $route : "/{$route}";
    }

    private function ensurePermissions(?string $permissionName): void
    {
        if (! $permissionName) {
            return;
        }

        collect(explode('|', $permissionName))
            ->map(fn (string $permission) => trim($permission))
            ->filter()
            ->each(fn (string $permission) => Permission::findOrCreate($permission));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function isDescendant(int $parentId, Menu $menu): bool
    {
        if (! $parentId) {
            return false;
        }

        $childrenByParent = Menu::query()
            ->get(['id', 'parent_id'])
            ->groupBy('parent_id');

        $stack = $childrenByParent->get($menu->id, collect())->pluck('id')->all();

        while ($stack !== []) {
            $currentId = array_pop($stack);

            if ($currentId === $parentId) {
                return true;
            }

            array_push(
                $stack,
                ...$childrenByParent->get($currentId, collect())->pluck('id')->all(),
            );
        }

        return false;
    }
}
