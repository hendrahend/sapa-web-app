<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Teacher = 'guru';
    case Student = 'siswa';
    case Parent = 'orang_tua';
}
