<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('xp_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('source', 20); // attendance | grade | lms
            $table->unsignedBigInteger('source_id')->nullable();
            $table->integer('points');
            $table->string('reason')->nullable();
            $table->timestamp('awarded_at')->index();
            $table->timestamps();

            $table->index(['student_id', 'awarded_at']);
            $table->unique(['student_id', 'source', 'source_id'], 'xp_events_dedupe_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('xp_events');
    }
};
