<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $statusFilter = trim((string) $request->string('status'));
        $kindFilter = trim((string) $request->string('kind'));
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min(100, $perPage));

        $notifications = $user->notifications()
            ->when($statusFilter === 'unread', fn ($query) => $query->whereNull('read_at'))
            ->when($statusFilter === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->when($kindFilter !== '', fn ($query) => $query->where('data->kind', $kindFilter))
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn ($n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'kind' => $n->data['kind'] ?? null,
                'data' => $n->data,
                'read_at' => optional($n->read_at)->toIso8601String(),
                'created_at' => optional($n->created_at)->toIso8601String(),
            ]);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'filters' => [
                'status' => $statusFilter,
                'kind' => $kindFilter,
                'per_page' => $perPage,
            ],
            'stats' => [
                'unread' => (int) $user->unreadNotifications()->count(),
                'total' => (int) $user->notifications()->count(),
            ],
        ]);
    }

    public function markRead(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $user->unreadNotifications()->where('id', $id)->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $user->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
