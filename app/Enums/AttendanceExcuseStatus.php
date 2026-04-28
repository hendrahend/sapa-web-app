<?php

namespace App\Enums;

enum AttendanceExcuseStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
