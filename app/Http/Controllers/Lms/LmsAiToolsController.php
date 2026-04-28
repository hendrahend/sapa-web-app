<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Services\Groq\GroqChatService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LmsAiToolsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('lms/ai-tools', [
            'aiEnabled' => filled(config('services.groq.key')),
        ]);
    }

    public function rubrik(Request $request, GroqChatService $groq): JsonResponse
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:2000'],
            'subject' => ['nullable', 'string', 'max:120'],
            'class_level' => ['nullable', 'string', 'max:120'],
            'criteria_count' => ['nullable', 'integer', 'min:2', 'max:8'],
        ]);

        $criteriaCount = $data['criteria_count'] ?? 4;

        $system = <<<'SYS'
Kamu adalah asisten AI untuk guru di Indonesia. Tugasmu membuat rubrik penilaian
yang jelas, objektif, dan sesuai standar kurikulum sekolah Indonesia.
Selalu balas dengan JSON valid sesuai schema yang diminta. Gunakan bahasa Indonesia.
Bobot kriteria harus berjumlah 100. Setiap kriteria memiliki 4 level deskriptor:
"sangat_baik" (90-100), "baik" (75-89), "cukup" (60-74), "perlu_perbaikan" (<60).
SYS;

        $user = <<<USR
Buatkan rubrik penilaian dengan {$criteriaCount} kriteria untuk tugas berikut:

Mata pelajaran: {$data['subject']}
Tingkat kelas: {$data['class_level']}
Deskripsi tugas:
{$data['description']}

Balas dalam JSON dengan struktur:
{
  "title": "judul singkat penilaian",
  "summary": "ringkasan tujuan penilaian (1-2 kalimat)",
  "criteria": [
    {
      "name": "nama kriteria",
      "weight": 25,
      "levels": {
        "sangat_baik": "deskripsi performansi level sangat baik",
        "baik": "deskripsi level baik",
        "cukup": "deskripsi level cukup",
        "perlu_perbaikan": "deskripsi level perlu perbaikan"
      }
    }
  ],
  "max_score": 100
}
USR;

        try {
            $rubrik = $groq->askJson($system, $user, 2000);
        } catch (RequestException) {
            return response()->json(['message' => 'AI belum bisa dihubungi. Coba lagi sebentar.'], 502);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['rubrik' => $rubrik]);
    }

    public function soal(Request $request, GroqChatService $groq): JsonResponse
    {
        $data = $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'subject' => ['nullable', 'string', 'max:120'],
            'class_level' => ['nullable', 'string', 'max:120'],
            'count' => ['required', 'integer', 'min:1', 'max:20'],
            'difficulty' => ['nullable', 'string', 'max:30'],
        ]);

        $difficulty = $data['difficulty'] ?? 'sedang';
        $count = $data['count'];

        $system = <<<'SYS'
Kamu adalah asisten AI untuk guru di Indonesia. Tugasmu membuat soal pilihan ganda
yang valid, jelas, dan tidak ambigu. Setiap soal punya 4 opsi (A, B, C, D)
dengan tepat 1 jawaban benar. Sertakan pembahasan singkat untuk setiap soal.
Selalu balas dengan JSON valid. Gunakan bahasa Indonesia.
SYS;

        $user = <<<USR
Buatkan {$count} soal pilihan ganda dengan tingkat kesulitan "{$difficulty}" tentang topik berikut:

Mata pelajaran: {$data['subject']}
Tingkat kelas: {$data['class_level']}
Topik: {$data['topic']}

Balas dalam JSON dengan struktur:
{
  "title": "judul kuis",
  "subject": "{$data['subject']}",
  "difficulty": "{$difficulty}",
  "questions": [
    {
      "question": "pertanyaan lengkap",
      "options": {
        "A": "opsi A",
        "B": "opsi B",
        "C": "opsi C",
        "D": "opsi D"
      },
      "answer": "A",
      "explanation": "pembahasan singkat mengapa jawaban itu benar"
    }
  ]
}
USR;

        try {
            $soal = $groq->askJson($system, $user, 3000);
        } catch (RequestException) {
            return response()->json(['message' => 'AI belum bisa dihubungi. Coba lagi sebentar.'], 502);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['soal' => $soal]);
    }
}
