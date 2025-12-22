import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { MerchantTraffic } from "../types";

interface MerchantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: MerchantTraffic | null;
  form: { merchant_id: string; platform_fee: string };
  setForm: (form: { merchant_id: string; platform_fee: string }) => void;
  formErrors: { [key: string]: string };
  actionLoading: boolean;
  onSave: () => void;
}

export default function MerchantSettingsModal({
  open,
  onOpenChange,
  merchant,
  form,
  setForm,
  formErrors,
  actionLoading,
  onSave
}: MerchantSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Настройки мерчанта</DialogTitle>
        </DialogHeader>
        {merchant && (
          <div className="mt-2 mb-4">
            <div className="space-y-1">
              <div className="font-medium">{merchant.merchant.username}</div>
              <div className="text-sm text-muted-foreground">@{merchant.merchant.login}</div>
              <div className="text-xs text-muted-foreground">{merchant.merchant.id}</div>
            </div>
          </div>
        )}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform-fee">Комиссия платформы (%)</Label>
            <Input
              id="platform-fee"
              type="text"
              value={form.platform_fee}
              onChange={(e) => setForm({...form, platform_fee: e.target.value})}
              placeholder="0.000"
              className={formErrors.platform_fee ? "border-red-500" : ""}
            />
            {formErrors.platform_fee && (
              <p className="text-sm text-red-500">{formErrors.platform_fee}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}