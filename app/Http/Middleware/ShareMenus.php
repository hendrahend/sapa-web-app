<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class ShareMenus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        Inertia::share('menus', function () use ($user) {
            if (! $user) {
                return [];
            }

            $unreadNotifications = (int) $user->unreadNotifications()->count();

            $menus = Menu::query()
                ->where('is_active', true)
                ->where('is_visible', true)
                ->orderBy('order')
                ->get();

            $buildTree = function ($parentId = null) use (&$buildTree, $menus, $user, $unreadNotifications) {
                return $menus
                    ->where('parent_id', $parentId)
                    ->filter(fn (Menu $menu) => $this->userCanAccess($user, $menu->permission_name))
                    ->map(function (Menu $menu) use (&$buildTree, $unreadNotifications) {
                        $children = $buildTree($menu->id)->values();

                        return [
                            'id' => $menu->id,
                            'title' => $menu->title,
                            'href' => $menu->route,
                            'icon' => $menu->icon,
                            'badge' => $menu->route === '/notifications'
                                ? ($unreadNotifications > 0 ? $unreadNotifications : null)
                                : null,
                            'children' => $children,
                        ];
                    })
                    ->filter(fn (array $menu) => $menu['href'] || $menu['children']->isNotEmpty())
                    ->values();
            };

            return $buildTree();
        });

        return $next($request);
    }

    private function userCanAccess(mixed $user, ?string $permissionName): bool
    {
        if (! $permissionName) {
            return true;
        }

        return collect(explode('|', $permissionName))
            ->map(fn (string $permission) => trim($permission))
            ->filter()
            ->contains(fn (string $permission) => $user->can($permission));
    }
}
