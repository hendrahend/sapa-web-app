<?php

namespace App\Enums;

enum AttendanceSessionStatus: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Closed = 'closed';
}
