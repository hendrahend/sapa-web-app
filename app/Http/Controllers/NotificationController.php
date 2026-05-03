<?php

namespace App\Http\Controllers;

use App\Enums\SystemPermission;
use App\Models\AttendanceRecord;
use App\Notifications\AttendanceRecordedForChild;
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

        abort_unless($user->can(SystemPermission::ViewNotifications->value), 403);

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
            ->through(function ($n) use ($user) {
                $data = $this->currentNotificationData($n->data, $user);

                return [
                    'id' => $n->id,
                    'type' => class_basename($n->type),
                    'kind' => $data['kind'] ?? null,
                    'data' => $data,
                    'read_at' => optional($n->read_at)->toIso8601String(),
                    'created_at' => optional($n->created_at)->toIso8601String(),
                ];
            });

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

        abort_unless($user->can(SystemPermission::ViewNotifications->value), 403);

        $user->unreadNotifications()->where('id', $id)->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        abort_unless($user->can(SystemPermission::ViewNotifications->value), 403);

        $user->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function currentNotificationData(array $data, object $notifiable): array
    {
        if (($data['kind'] ?? null) !== 'attendance.recorded') {
            return $data;
        }

        $recordId = (int) ($data['attendance_record_id'] ?? 0);
        if ($recordId <= 0) {
            return $data;
        }

        $record = AttendanceRecord::query()
            ->with(['student', 'session.schoolLocation'])
            ->find($recordId);

        if (! $record) {
            return $data;
        }

        return (new AttendanceRecordedForChild($record))->toArray($notifiable);
    }
}
