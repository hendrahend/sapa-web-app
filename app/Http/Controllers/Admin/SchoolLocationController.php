<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolLocationRequest;
use App\Models\SchoolLocation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SchoolLocationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/school-location/index', [
            'location' => SchoolLocation::query()->latest('id')->first(),
        ]);
    }

    public function store(SchoolLocationRequest $request): RedirectResponse
    {
        $location = SchoolLocation::query()->latest('id')->first();

        if ($location) {
            $location->update($request->validated());
            $this->successToast('Lokasi sekolah berhasil diperbarui.');
        } else {
            SchoolLocation::create($request->validated());
            $this->successToast('Lokasi sekolah berhasil disimpan.');
        }

        return to_route('admin.school-location.index');
    }
}
