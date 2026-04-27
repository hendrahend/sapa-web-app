<?php

namespace App\Services\Groq;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GroqChatService
{
    /**
     * @param  array<string, mixed>  $context
     *
     * @throws RequestException
     */
    public function ask(string $message, array $context = []): string
    {
        $apiKey = config('services.groq.key');

        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('GROQ_API_KEY belum diatur.');
        }

        $baseUrl = rtrim((string) config('services.groq.base_url'), '/');

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->asJson()
            ->timeout(45)
            ->post("{$baseUrl}/chat/completions", [
                'model' => config('services.groq.model', 'llama-3.1-8b-instant'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->systemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => $this->buildUserPrompt($message, $context),
                    ],
                ],
                'temperature' => 0.7,
                'max_completion_tokens' => 900,
                'top_p' => 1,
                'stream' => false,
            ])
            ->throw();

        $answer = $response->json('choices.0.message.content');

        if (! is_string($answer) || trim($answer) === '') {
            throw new RuntimeException('Groq tidak mengembalikan jawaban.');
        }

        return trim($answer);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah asisten AI untuk LMS SAPA, sistem sekolah berbahasa Indonesia.
Tugasmu membantu guru dan siswa memahami materi, membuat rangkuman, ide soal latihan, rubrik tugas, dan feedback belajar.
Jawab ringkas, ramah, terstruktur, dan gunakan bahasa Indonesia.
Jangan mengarang data kelas, nilai, atau materi yang tidak ada di konteks. Jika konteks kurang, sebutkan asumsi atau minta detail tambahan.
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function buildUserPrompt(string $message, array $context): string
    {
        $contextJson = json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Konteks LMS saat ini:
{$contextJson}

Pertanyaan atau instruksi pengguna:
{$message}
PROMPT;
    }
}
