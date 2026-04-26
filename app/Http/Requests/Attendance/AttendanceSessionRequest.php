<?php

namespace App\Http\Requests\Attendance;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(SystemPermission::ManageAttendance->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')],
            'school_location_id' => ['required', 'integer', Rule::exists('school_locations', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'attendance_date' => ['required', 'date'],
            'starts_at' => ['required', 'date_format:H:i'],
            'late_after' => ['nullable', 'date_format:H:i', 'after_or_equal:starts_at', 'before_or_equal:ends_at'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
