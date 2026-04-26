<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case Present = 'hadir';
    case Late = 'terlambat';
    case Excused = 'izin';
    case Sick = 'sakit';
    case Absent = 'alfa';
}
