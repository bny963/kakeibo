<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PiggyBankRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'week_start_date',
        'weekly_allowance',
        'spent_amount',
        'saved_amount',
    ];

    protected function casts(): array
    {
        return [
            'week_start_date' => 'date:Y-m-d',
            'weekly_allowance' => 'decimal:2',
            'spent_amount' => 'decimal:2',
            'saved_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
