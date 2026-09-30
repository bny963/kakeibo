import { Check, Lock, Sparkles } from "lucide-react";
import {
  useEquipPiggyBankSkin,
  usePiggyBankSkinCatalog,
  useUnlockPiggyBankSkin,
} from "@/features/piggyBank/api";
import { patternBackgroundStyle } from "@/features/piggyBank/lib/skinPatterns";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PiggyBankSkin, PiggyBankSkinCategory } from "@/types/api";

interface PiggyBankCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<PiggyBankSkinCategory, string> = {
  color: "色",
  pattern: "柄",
  character: "キャラクター",
};

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）をポイントで解禁・着せ替えするモーダル。
 *
 * 完全にコスメティックな要素のみを扱う、無視してよい任意の機能。記録・レポート等の
 * アプリ本来の機能は一切ここに依存しない。既存の「赤字・警告色を使わない」配色ポリシーとは
 * 別レイヤーのため、ここで選べる色（ピンクやゴールド等）は貯金箱メーターの状態色を
 * 置き換えるものではなく、あくまで装飾（アイコン・カードの縁取り）にのみ使う。
 */
export function PiggyBankCustomizeDialog({ open, onOpenChange }: PiggyBankCustomizeDialogProps) {
  const { data: catalog, isLoading } = usePiggyBankSkinCatalog();
  const unlockSkin = useUnlockPiggyBankSkin();
  const equipSkin = useEquipPiggyBankSkin();
  const { toast } = useToast();

  async function handleUnlock(skin: PiggyBankSkin) {
    try {
      await unlockSkin.mutateAsync(skin.key);
      toast({ title: `「${skin.label}」を解禁しました！`, variant: "success" });
    } catch (error) {
      toast({
        title: "解禁できませんでした",
        description: getErrorMessage(error, "通信に失敗しました。しばらくしてから再度お試しください"),
        variant: "caution",
      });
    }
  }

  async function handleEquip(skin: PiggyBankSkin) {
    try {
      await equipSkin.mutateAsync(skin.key);
    } catch (error) {
      toast({
        title: "変更できませんでした",
        description: getErrorMessage(error, "通信に失敗しました。しばらくしてから再度お試しください"),
        variant: "caution",
      });
    }
  }

  const grouped = catalog
    ? (["color", "pattern", "character"] as const).map((category) => ({
        category,
        skins: catalog.skins.filter((skin) => skin.category === category),
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-600" />
            貯金箱のきせかえ
          </DialogTitle>
          <DialogDescription>
            貯まったポイントで、貯金箱の色・柄・キャラクターを自由に着せ替えられます。
            記録や集計には一切関係ない、完全に自由なお楽しみ要素です。
            <br />
            ポイントは、確定した週の貯金箱の金額の合計10円につき1ptです（合計してから端数を切り捨て）。
            週が終わった翌週の月曜0時過ぎに確定・加算され、一度確定した週のポイントは後から減りません。
          </DialogDescription>
        </DialogHeader>

        {isLoading || !catalog ? (
          <p className="py-8 text-center text-sm text-ink-400">読み込み中...</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl bg-gold-50 px-4 py-3">
              <span className="text-sm text-ink-700">現在のポイント</span>
              <span className="text-lg font-semibold text-gold-700">
                {catalog.points_balance.toLocaleString("ja-JP")}pt
              </span>
            </div>

            <Tabs defaultValue="color" className="mt-4">
              <TabsList>
                {grouped.map(({ category }) => (
                  <TabsTrigger key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {grouped.map(({ category, skins }) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {skins.map((skin) => (
                      <SkinCard
                        key={skin.key}
                        skin={skin}
                        onUnlock={() => handleUnlock(skin)}
                        onEquip={() => handleEquip(skin)}
                        isUnlocking={unlockSkin.isPending}
                        isEquipping={equipSkin.isPending}
                        canAfford={catalog.points_balance >= skin.cost}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SkinCardProps {
  skin: PiggyBankSkin;
  onUnlock: () => void;
  onEquip: () => void;
  isUnlocking: boolean;
  isEquipping: boolean;
  canAfford: boolean;
}

function SkinCard({ skin, onUnlock, onEquip, isUnlocking, isEquipping, canAfford }: SkinCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center",
        skin.equipped ? "border-brand-400 bg-brand-50" : "border-ink-100 bg-white",
      )}
    >
      <SkinPreview skin={skin} />
      <p className="text-sm font-medium text-ink-900">{skin.label}</p>

      {skin.equipped ? (
        <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          装着中
        </Badge>
      ) : skin.owned ? (
        <Button size="sm" variant="outline" onClick={onEquip} disabled={isEquipping}>
          着せる
        </Button>
      ) : (
        <Button
          size="sm"
          variant={canAfford ? "gold" : "outline"}
          onClick={onUnlock}
          disabled={isUnlocking || !canAfford}
        >
          {canAfford ? (
            `${skin.cost}ptで解禁`
          ) : (
            <>
              <Lock className="h-3 w-3" />
              {skin.cost}pt必要
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function SkinPreview({ skin }: { skin: PiggyBankSkin }) {
  if (skin.category === "character") {
    return <span className="text-3xl leading-none">{skin.value}</span>;
  }

  if (skin.category === "color") {
    return (
      <span
        className="h-8 w-8 rounded-full border border-ink-100"
        style={{ backgroundColor: skin.value }}
        aria-hidden="true"
      />
    );
  }

  // pattern
  return (
    <span
      className="h-8 w-8 rounded-lg border border-ink-100 bg-ink-50"
      style={patternBackgroundStyle(skin.value, "#158567")}
      aria-hidden="true"
    />
  );
}
