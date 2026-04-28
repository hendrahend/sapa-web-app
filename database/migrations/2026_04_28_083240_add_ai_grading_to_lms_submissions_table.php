<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_submissions', function (Blueprint $table) {
            $table->json('ai_grade_data')->nullable()->after('feedback');
            $table->timestamp('ai_graded_at')->nullable()->after('ai_grade_data');
        });
    }

    public function down(): void
    {
        Schema::table('lms_submissions', function (Blueprint $table) {
            $table->dropColumn(['ai_grade_data', 'ai_graded_at']);
        });
    }
};
