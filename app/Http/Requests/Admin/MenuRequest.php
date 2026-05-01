<?php

namespace App\Http\Requests\Admin;

use App\Enums\SystemPermission;
use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = $this->isMethod('put') || $this->isMethod('patch')
            ? SystemPermission::UpdateMenus
            : SystemPermission::CreateMenus;

        return $this->user()?->can($permission->value) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $menu = $this->route('menu');
        $menuId = $menu instanceof Menu ? $menu->id : null;

        return [
            'parent_id' => [
                'nullable',
                'integer',
                'exists:menus,id',
                Rule::notIn(array_filter([$menuId])),
            ],
            'title' => ['required', 'string', 'max:120'],
            'route' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:80'],
            'permission_name' => ['nullable', 'string', 'max:255'],
            'order' => ['required', 'integer', 'min:0', 'max:65535'],
            'is_visible' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
