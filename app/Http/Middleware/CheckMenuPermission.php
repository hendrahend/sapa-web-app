<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuPermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $routeUri = '/'.ltrim((string) $request->route()?->uri(), '/');
        $requestPath = '/'.ltrim($request->path(), '/');

        $menu = Menu::query()
            ->where('is_active', true)
            ->where(function ($query) use ($routeUri, $requestPath) {
                $query->where('route', $routeUri)
                    ->orWhere('route', $requestPath);
            })
            ->first();

        if ($menu?->permission_name && ! $this->userCanAccess($user, $menu->permission_name)) {
            abort(403, 'Anda tidak memiliki izin untuk mengakses halaman ini.');
        }

        return $next($request);
    }

    private function userCanAccess(mixed $user, string $permissionName): bool
    {
        return collect(explode('|', $permissionName))
            ->map(fn (string $permission) => trim($permission))
            ->filter()
            ->contains(fn (string $permission) => $user->can($permission));
    }
}
