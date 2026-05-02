<?php

namespace App\Http\Requests\Admin;

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->route('user')
            ? SystemPermission::UpdateUsers
            : SystemPermission::CreateUsers;

        return $this->user()?->can($permission->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');
        $student = $user?->student;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'role' => ['required', Rule::in(array_map(fn (UserRole $role) => $role->value, UserRole::cases()))],
            'email_verified' => ['required', 'boolean'],
            'create_student_profile' => ['required', 'boolean'],
            'school_class_id' => ['nullable', 'required_if:create_student_profile,true', 'integer', Rule::exists('school_classes', 'id')],
            'nis' => ['nullable', 'string', 'max:50', Rule::unique('students', 'nis')->ignore($student?->id)],
            'nisn' => ['nullable', 'string', 'max:50', Rule::unique('students', 'nisn')->ignore($student?->id)],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
        ];
    }
}
