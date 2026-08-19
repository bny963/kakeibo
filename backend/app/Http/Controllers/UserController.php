<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /** ログイン中ユーザー取得。 */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
