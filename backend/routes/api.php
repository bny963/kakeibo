<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MonthlyPlanController;
use App\Http\Controllers\PiggyBankController;
use App\Http\Controllers\RecurringRuleController;
use App\Http\Controllers\SummaryController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// 認証不要（基本設計書 Route,Controller 参照）
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// 認証必須
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'show']);

    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // /transactions/export は /transactions/{id} より前に定義する（{id}に一致してしまうため）
    Route::get('/transactions/export', [TransactionController::class, 'export']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    Route::get('/summary/monthly', [SummaryController::class, 'monthly']);
    Route::get('/summary/category', [SummaryController::class, 'category']);

    Route::get('/monthly-plans/{month}', [MonthlyPlanController::class, 'show']);
    Route::post('/monthly-plans', [MonthlyPlanController::class, 'store']);

    Route::get('/piggy-bank', [PiggyBankController::class, 'index']);
    Route::get('/piggy-bank/this-week', [PiggyBankController::class, 'thisWeek']);

    Route::get('/budgets', [BudgetController::class, 'index']);
    Route::post('/budgets', [BudgetController::class, 'store']);
    Route::put('/budgets/{id}', [BudgetController::class, 'update']);
    Route::delete('/budgets/{id}', [BudgetController::class, 'destroy']);

    Route::get('/recurring-rules', [RecurringRuleController::class, 'index']);
    Route::post('/recurring-rules', [RecurringRuleController::class, 'store']);
    Route::put('/recurring-rules/{id}', [RecurringRuleController::class, 'update']);
    Route::delete('/recurring-rules/{id}', [RecurringRuleController::class, 'destroy']);
});
