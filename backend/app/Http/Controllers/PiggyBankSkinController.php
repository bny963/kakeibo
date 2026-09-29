<?php

namespace App\Http\Controllers;

use App\Services\PiggyBankSkinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）をポイントで解禁・着せ替えするAPI。
 * すべてコスメティック要素であり、記録・集計・レポート等の本来機能には一切影響しない、
 * 完全に任意で無視してよい層として実装している。
 */
class PiggyBankSkinController extends Controller
{
    public function __construct(private readonly PiggyBankSkinService $skinService)
    {
    }

    /** 自分のポイント残高・カタログ全体（解禁/装着状態つき）・現在の装着中スキンのみ取得できる。 */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'points_balance' => $this->skinService->pointsBalance($user),
            'skins' => array_values($this->skinService->catalogFor($user)),
            'appearance' => $this->skinService->equippedAppearance($user),
        ]);
    }

    /** 自分のポイントを消費してスキンを1つ解禁する。ポイント不足時は422（InsufficientPiggyBankPointsException）。 */
    public function unlock(Request $request, string $skinKey): JsonResponse
    {
        $this->skinService->unlock($request->user(), $skinKey);

        $user = $request->user();

        return response()->json([
            'points_balance' => $this->skinService->pointsBalance($user),
            'skins' => array_values($this->skinService->catalogFor($user)),
            'appearance' => $this->skinService->equippedAppearance($user),
        ], 201);
    }

    /** 自分が解禁済みのスキンを装着する。未解禁の場合は422（PiggyBankSkinNotOwnedException）。 */
    public function equip(Request $request, string $skinKey): JsonResponse
    {
        $this->skinService->equip($request->user(), $skinKey);

        $user = $request->user();

        return response()->json([
            'points_balance' => $this->skinService->pointsBalance($user),
            'skins' => array_values($this->skinService->catalogFor($user)),
            'appearance' => $this->skinService->equippedAppearance($user),
        ]);
    }
}
