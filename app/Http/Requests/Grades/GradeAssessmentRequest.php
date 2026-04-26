<?php

namespace App\Http\Requests\Grades;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GradeAssessmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(SystemPermission::ManageGrades->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['tugas', 'kuis', 'praktik', 'uts', 'uas'])],
            'assessment_date' => ['nullable', 'date'],
            'max_score' => ['required', 'integer', 'min:1', 'max:1000'],
            'weight' => ['required', 'integer', 'min:1', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
