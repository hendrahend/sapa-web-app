<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsAiChatRequest;
use App\Models\LmsAiMessage;
use App\Services\Groq\GroqChatService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class LmsAiChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $courseId = $request->integer('course_id') ?: null;

        $messages = LmsAiMessage::query()
            ->where('user_id', $user->id)
            ->when($courseId, fn ($q) => $q->where('lms_course_id', $courseId))
            ->latest('id')
            ->limit(40)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (LmsAiMessage $m) => [
                'id' => $m->id,
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => optional($m->created_at)->toIso8601String(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    public function store(LmsAiChatRequest $request, GroqChatService $groq): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $message = (string) $request->validated('message');
        $courseId = $request->integer('course_id') ?: null;

        $userMessage = LmsAiMessage::create([
            'user_id' => $user->id,
            'lms_course_id' => $courseId,
            'role' => 'user',
            'content' => $message,
        ]);

        // Build chat history context
        $window = (int) config('sapa.lms_ai.history_window', 6);
        $history = LmsAiMessage::query()
            ->where('user_id', $user->id)
            ->when($courseId, fn ($q) => $q->where('lms_course_id', $courseId))
            ->where('id', '<', $userMessage->id)
            ->latest('id')
            ->limit($window)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (LmsAiMessage $m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        $context = (array) $request->validated('context', []);
        $context['history'] = $history;

        try {
            $answer = $groq->ask($message, $context);
        } catch (RequestException) {
            $userMessage->delete();

            return response()->json([
                'message' => 'AI LMS belum bisa dihubungi. Coba lagi sebentar.',
            ], 502);
        } catch (RuntimeException $exception) {
            $userMessage->delete();

            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $assistant = LmsAiMessage::create([
            'user_id' => $user->id,
            'lms_course_id' => $courseId,
            'role' => 'assistant',
            'content' => $answer,
        ]);

        return response()->json([
            'answer' => $answer,
            'message_id' => $assistant->id,
            'user_message_id' => $userMessage->id,
        ]);
    }
}
