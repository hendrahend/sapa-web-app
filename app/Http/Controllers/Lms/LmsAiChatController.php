<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsAiChatRequest;
use App\Services\Groq\GroqChatService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class LmsAiChatController extends Controller
{
    public function store(LmsAiChatRequest $request, GroqChatService $groq): JsonResponse
    {
        try {
            $answer = $groq->ask(
                $request->validated('message'),
                $request->validated('context', []),
            );
        } catch (RequestException) {
            return response()->json([
                'message' => 'AI LMS belum bisa dihubungi. Coba lagi sebentar.',
            ], 502);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'answer' => $answer,
        ]);
    }
}
