<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsMaterialRequest;
use App\Models\LmsMaterial;
use Illuminate\Http\RedirectResponse;

class LmsMaterialController extends Controller
{
    public function store(LmsMaterialRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $attachment = $request->file('attachment');

        LmsMaterial::create([
            'lms_course_id' => $validated['lms_course_id'],
            'title' => $validated['title'],
            'content' => $validated['content'] ?? '',
            'attachment_path' => $attachment?->store('lms-materials', 'public'),
            'attachment_name' => $attachment?->getClientOriginalName(),
            'attachment_mime' => $attachment?->getClientMimeType(),
            'attachment_size' => $attachment?->getSize(),
            'published_at' => $validated['publish_now'] ? now() : null,
        ]);

        $this->successToast(
            $validated['publish_now']
                ? 'Materi berhasil disimpan dan dipublikasikan.'
                : 'Materi berhasil disimpan sebagai draft.'
        );

        return to_route('lms.index');
    }
}
