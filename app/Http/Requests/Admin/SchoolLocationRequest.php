<?php

namespace App\Http\Requests\Admin;

use App\Enums\SystemPermission;
use App\Models\SchoolLocation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SchoolLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = SchoolLocation::query()->exists()
            ? SystemPermission::UpdateSchoolLocations
            : SystemPermission::CreateSchoolLocations;

        return $this->user()?->can($permission->value) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_meters' => ['required', 'integer', 'min:10', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
