<?php

namespace App\Http\Requests\Attendance;

use App\Enums\SystemPermission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceCheckInRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(SystemPermission::CreateOwnAttendance->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'attendance_session_id' => ['required', 'integer', Rule::exists('attendance_sessions', 'id')],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'location_accuracy_meters' => ['required', 'integer', 'min:0', 'max:5000'],
            'selfie' => ['required', 'image', 'max:4096'],
        ];
    }
}
