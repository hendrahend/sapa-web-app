<?php

namespace App\Http\Requests\Lms;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LmsAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(SystemPermission::CreateLms->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lms_course_id' => ['required', 'integer', Rule::exists('lms_courses', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['required', 'string', 'max:10000'],
            'due_at' => ['nullable', 'date'],
            'max_score' => ['required', 'integer', 'min:1', 'max:1000'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
