<?php

namespace App\Http\Requests\Admin;

use App\Enums\SystemPermission;
use App\Models\Student;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->route('student')
            ? SystemPermission::UpdateStudents
            : SystemPermission::CreateStudents;

        return $this->user()?->can($permission->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Student|null $student */
        $student = $this->route('student');

        return [
            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id'),
                Rule::unique('students', 'user_id')->ignore($student?->id),
            ],
            'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')],
            'nis' => ['nullable', 'string', 'max:50', Rule::unique('students', 'nis')->ignore($student?->id)],
            'nisn' => ['nullable', 'string', 'max:50', Rule::unique('students', 'nisn')->ignore($student?->id)],
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'birth_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
            'parent_user_ids' => ['nullable', 'array'],
            'parent_user_ids.*' => ['integer', Rule::exists('users', 'id')],
            'new_parent_name' => ['nullable', 'required_with:new_parent_email', 'string', 'max:255'],
            'new_parent_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
        ];
    }
}
