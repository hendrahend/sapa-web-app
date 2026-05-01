<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->json('metrics');
            $table->text('summary')->nullable();
            $table->json('highlights')->nullable();
            $table->json('at_risk_students')->nullable();
            $table->json('recommendations')->nullable();
            $table->timestamp('generated_at');
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['school_class_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_insights');
    }
};
