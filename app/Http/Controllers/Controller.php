<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

abstract class Controller
{
    protected function successToast(string $message): void
    {
        $this->toast('success', $message);
    }

    protected function errorToast(string $message): void
    {
        $this->toast('error', $message);
    }

    protected function infoToast(string $message): void
    {
        $this->toast('info', $message);
    }

    private function toast(string $type, string $message): void
    {
        Inertia::flash('toast', [
            'type' => $type,
            'message' => $message,
        ]);
    }
}
