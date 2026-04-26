<?php

namespace App\Http\Requests\Grades;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GradeScoreRequest extends FormRequest
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
            'grade_assessment_id' => ['required', 'integer', Rule::exists('grade_assessments', 'id')],
            'student_id' => ['required', 'integer', Rule::exists('students', 'id')],
            'score' => ['required', 'numeric', 'min:0', 'max:1000'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
