<?php

namespace App\Enums;

enum SystemPermission: string
{
    case ManageUsers = 'users.manage';
    case ManageSchoolLocations = 'school_locations.manage';
    case ManageAttendance = 'attendance.manage';
    case ViewAttendance = 'attendance.view';
    case ViewOwnAttendance = 'attendance.own.view';
    case ManageGrades = 'grades.manage';
    case ViewGrades = 'grades.view';
    case ManageLms = 'lms.manage';
    case ViewLms = 'lms.view';
    case SubmitLmsAssignments = 'lms.assignments.submit';
    case ManageXp = 'xp.manage';
    case ViewXp = 'xp.view';
    case ViewChildren = 'children.view';
    case ManageNotifications = 'notifications.manage';
    case ViewNotifications = 'notifications.view';
}
