<?php

namespace App\Http\Requests\Lms;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LmsMaterialRequest extends FormRequest
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
            'content' => ['nullable', 'required_without:attachment', 'string', 'max:10000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,ppt,pptx,xls,xlsx,txt', 'max:10240'],
            'publish_now' => ['required', 'boolean'],
        ];
    }
}
