<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lms_ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lms_course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('role', 16); // user | assistant
            $table->text('content');
            $table->timestamps();

            $table->index(['user_id', 'lms_course_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_ai_messages');
    }
};
