<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceExcuseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceExcuseDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('attendance.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                AttendanceExcuseStatus::Approved->value,
                AttendanceExcuseStatus::Rejected->value,
            ])],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
