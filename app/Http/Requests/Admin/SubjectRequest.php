<?php

namespace App\Http\Requests\Admin;

use App\Enums\SystemPermission;
use App\Models\Subject;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->route('subject')
            ? SystemPermission::UpdateSubjects
            : SystemPermission::CreateSubjects;

        return $this->user()?->can($permission->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Subject|null $subject */
        $subject = $this->route('subject');

        return [
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('subjects', 'name')->ignore($subject?->id),
            ],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('subjects', 'code')->ignore($subject?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
