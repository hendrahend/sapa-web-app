<?php

namespace App\Enums;

enum SystemPermission: string
{
    case ViewUsers = 'users.view';
    case CreateUsers = 'users.create';
    case UpdateUsers = 'users.update';
    case DeleteUsers = 'users.delete';

    case ViewStudents = 'students.view';
    case CreateStudents = 'students.create';
    case UpdateStudents = 'students.update';
    case DeleteStudents = 'students.delete';

    case ViewClasses = 'classes.view';
    case CreateClasses = 'classes.create';
    case UpdateClasses = 'classes.update';
    case DeleteClasses = 'classes.delete';

    case ViewRoles = 'roles.view';
    case CreateRoles = 'roles.create';
    case UpdateRoles = 'roles.update';
    case DeleteRoles = 'roles.delete';

    case ViewMenus = 'menus.view';
    case CreateMenus = 'menus.create';
    case UpdateMenus = 'menus.update';
    case DeleteMenus = 'menus.delete';

    case ViewSchoolLocations = 'school_locations.view';
    case CreateSchoolLocations = 'school_locations.create';
    case UpdateSchoolLocations = 'school_locations.update';
    case DeleteSchoolLocations = 'school_locations.delete';

    case ViewAttendance = 'attendance.view';
    case CreateAttendance = 'attendance.create';
    case UpdateAttendance = 'attendance.update';
    case DeleteAttendance = 'attendance.delete';
    case ViewOwnAttendance = 'attendance.own.view';
    case CreateOwnAttendance = 'attendance.own.create';

    case ViewGrades = 'grades.view';
    case CreateGrades = 'grades.create';
    case UpdateGrades = 'grades.update';
    case DeleteGrades = 'grades.delete';

    case ViewLms = 'lms.view';
    case CreateLms = 'lms.create';
    case UpdateLms = 'lms.update';
    case DeleteLms = 'lms.delete';
    case SubmitLmsAssignments = 'lms.assignments.submit';

    case ViewXp = 'xp.view';
    case CreateXp = 'xp.create';
    case UpdateXp = 'xp.update';
    case DeleteXp = 'xp.delete';

    case ViewChildren = 'children.view';

    case ViewNotifications = 'notifications.view';
    case CreateNotifications = 'notifications.create';
    case UpdateNotifications = 'notifications.update';
    case DeleteNotifications = 'notifications.delete';

    case ViewRewards = 'rewards.view';
    case ManageRewards = 'rewards.manage';
    case RedeemRewards = 'rewards.redeem';
}
