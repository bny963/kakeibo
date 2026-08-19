<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'category_id',
        'type',
        'amount',
        'date',
        'note',
        'is_recurring',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
            'is_recurring' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * "YYYY-MM" 形式の月で絞り込む。DATE_FORMAT等のMySQL固有関数を避け、
     * whereYear/whereMonthで組み立てることでMySQL/SQLite双方で同じ挙動になるようにする
     * （テスト実行時はSQLiteインメモリDBを使う想定）。
     */
    public function scopeForMonth(Builder $query, string $month): Builder
    {
        [$year, $monthNumber] = explode('-', $month);

        return $query->whereYear('date', (int) $year)->whereMonth('date', (int) $monthNumber);
    }
}
