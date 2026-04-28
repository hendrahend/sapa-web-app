<?php

namespace App\Http\Requests\Lms;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LmsAiChatRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(SystemPermission::ViewLms->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:2000'],
            'course_id' => ['nullable', 'integer', 'exists:lms_courses,id'],
            'context' => ['nullable', 'array'],
            'context.courses' => ['nullable', 'array', 'max:5'],
            'context.materials' => ['nullable', 'array', 'max:5'],
            'context.assignments' => ['nullable', 'array', 'max:5'],
        ];
    }
}
