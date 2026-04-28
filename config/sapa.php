<?php

return [
    /*
    |--------------------------------------------------------------------------
    | XP rewards
    |--------------------------------------------------------------------------
    |
    | Points awarded by XpService when an event of each kind happens.
    | Tweak these to rebalance gamification without touching code.
    */
    'xp' => [
        'level_threshold' => 160,
        'attendance_present' => 20,
        'attendance_late' => 10,
        'grade_passed' => 30,        // when a GradeScore >= 75
        'grade_excellent' => 50,     // when a GradeScore >= 90
        'grade_pass_threshold' => 75,
        'grade_excellent_threshold' => 90,
        'lms_submission' => 25,      // on first submit
        'lms_graded' => 15,          // when a teacher grades the submission
    ],

    /*
    |--------------------------------------------------------------------------
    | Parent notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        // When true, parents also receive an e-mail in addition to the in-app inbox.
        // Requires MAIL_* env to be configured.
        'mail_enabled' => (bool) env('SAPA_PARENT_MAIL_ENABLED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | LMS AI assistant
    |--------------------------------------------------------------------------
    */
    'lms_ai' => [
        // Number of recent messages to send back to Groq for context
        'history_window' => 6,
    ],
];
