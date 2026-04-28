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

        $notifications = $user->notifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'kind' => $n->data['kind'] ?? null,
                'data' => $n->data,
                'read_at' => optional($n->read_at)->toIso8601String(),
                'created_at' => optional($n->created_at)->toIso8601String(),
            ]);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
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
