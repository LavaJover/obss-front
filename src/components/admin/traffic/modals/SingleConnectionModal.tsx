import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Clock, Unlock, Shield, Lock } from "lucide-react";
import { TrafficRecord, User } from "../types";
import { validatePercentageInput, formatDecimal, parseDurationToMinutes, formatDurationFromMinutes, PRIORITY_OPTIONS } from "../utils";
import { useEffect, useState } from "react";

interface SingleConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: TrafficRecord | null;
  merchants: User[];
  traders: User[];
  actionLoading: boolean;
  onSave: (connectionId: string, data: any) => Promise<void>;
  onDelete: (connectionId: string) => void;
}

export default function SingleConnectionModal({
  open,
  onOpenChange,
  connection,
  merchants,
  traders,
  actionLoading,
  onSave,
  onDelete
}: SingleConnectionModalProps) {
  const [form, setForm] = useState({
    connection_id: "",
    merchant_id: "",
    trader_id: "",
    trader_reward: "",
    trader_priority: "1",
    name: "",
    activity_params: {
      merchant_unlocked: true,
      trader_unlocked: true,
      antifraud_unlocked: true,
      manually_unlocked: true
    },
    antifraud_params: {
      antifraud_required: false
    },
    business_params: {
      merchant_deals_duration: "24h0m0s"
    },
    merchant_deals_duration_minutes: "1440"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");

  // Инициализация формы при открытии модалки
// Используйте useEffect:
// Исправляем инициализацию
useEffect(() => {
  if (connection) {
    const merchant = merchants.find(m => m.id === connection.merchant_id);
    const trader = traders.find(t => t.id === connection.trader_id);
    
    setForm({
      connection_id: connection.id,
      merchant_id: connection.merchant_id,
      trader_id: connection.trader_id,
      trader_reward: formatDecimal(connection.trader_reward_percent),
      trader_priority: connection.trader_priority.toString(),
      name: connection.name || merchant?.username || "",
      activity_params: connection.activity_params || {
        merchant_unlocked: true,
        trader_unlocked: true,
        antifraud_unlocked: true,
        manually_unlocked: true
      },
      antifraud_params: connection.antifraud_params || {
        antifraud_required: false
      },
      business_params: connection.business_params || {
        merchant_deals_duration: "24h0m0s"
      },
      merchant_deals_duration_minutes: parseDurationToMinutes(connection.business_params?.merchant_deals_duration || "24h0m0s")
    });
  }
}, [connection, merchants, traders]);

// Сброс формы при закрытии
useEffect(() => {
  if (!open) {
    setForm({
      connection_id: "",
      merchant_id: "",
      trader_id: "",
      trader_reward: "",
      trader_priority: "1",
      name: "",
      activity_params: {
        merchant_unlocked: true,
        trader_unlocked: true,
        antifraud_unlocked: true,
        manually_unlocked: true
      },
      antifraud_params: {
        antifraud_required: false
      },
      business_params: {
        merchant_deals_duration: "24h0m0s"
      },
      merchant_deals_duration_minutes: "1440"
    });
    setFormErrors({});
    setActiveTab("basic");
  }
}, [open]);

  if (!connection) return null;

  const merchant = merchants.find(m => m.id === connection.merchant_id);
  const trader = traders.find(t => t.id === connection.trader_id);

  const handleSave = async () => {
    const reward = parseFloat(form.trader_reward);
    const priority = parseInt(form.trader_priority);
    const errors: Record<string, string> = {};

    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }

    if (isNaN(priority) || priority < 0) {
      errors.trader_priority = "Введите корректный приоритет";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const saveData = {
      id: form.connection_id,
      trader_reward: reward / 100,
      trader_priority: priority,
      name: form.name,
      activity_params: form.activity_params,
      antifraud_params: form.antifraud_params,
      business_params: {
        merchant_deals_duration: formatDurationFromMinutes(form.merchant_deals_duration_minutes)
      }
    };

    await onSave(form.connection_id, saveData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Редактировать подключение</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-sm font-medium mb-1">Мерчант</Label>
            <div className="space-y-1">
              <div className="font-medium">{merchant?.username || connection.merchant_id}</div>
              <div className="text-sm text-muted-foreground">@{merchant?.login}</div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1">Трейдер</Label>
            <div className="space-y-1">
              <div className="font-medium">{trader?.username || connection.trader_id}</div>
              <div className="text-sm text-muted-foreground">@{trader?.login}</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Основное</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
            <TabsTrigger value="security">Безопасность</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Название подключения"
                />
              </div>
              <div className="space-y-2">
                <Label>Награда трейдера (%)</Label>
                <Input
                  type="text"
                  value={form.trader_reward}
                  onChange={(e) => {
                    const validated = validatePercentageInput(e.target.value);
                    setForm({...form, trader_reward: validated});
                    if (formErrors.trader_reward) {
                      const newErrors = {...formErrors};
                      delete newErrors.trader_reward;
                      setFormErrors(newErrors);
                    }
                  }}
                  placeholder="0.000"
                  className={formErrors.trader_reward ? "border-red-500" : ""}
                />
                {formErrors.trader_reward && (
                  <p className="text-sm text-red-500">{formErrors.trader_reward}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select
                value={form.trader_priority}
                onValueChange={(value) => setForm({...form, trader_priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Время на сделку (минуты)
              </Label>
              <Input
                type="number"
                min={1}
                max={10080}
                value={form.merchant_deals_duration_minutes}
                onChange={(e) => setForm({...form, merchant_deals_duration_minutes: e.target.value})}
                placeholder="1440"
              />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                <Label>Мерчант разблокирован</Label>
              </div>
              <Switch
                checked={form.activity_params.merchant_unlocked}
                onCheckedChange={(checked) => setForm({
                  ...form,
                  activity_params: {...form.activity_params, merchant_unlocked: checked}
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                <Label>Трейдер разблокирован</Label>
              </div>
              <Switch
                checked={form.activity_params.trader_unlocked}
                onCheckedChange={(checked) => setForm({
                  ...form,
                  activity_params: {...form.activity_params, trader_unlocked: checked}
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label>Антифрод разблокирован</Label>
              </div>
              <Switch
                checked={form.activity_params.antifraud_unlocked}
                onCheckedChange={(checked) => setForm({
                  ...form,
                  activity_params: {...form.activity_params, antifraud_unlocked: checked}
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label>Ручная разблокировка</Label>
              </div>
              <Switch
                checked={form.activity_params.manually_unlocked}
                onCheckedChange={(checked) => setForm({
                  ...form,
                  activity_params: {...form.activity_params, manually_unlocked: checked}
                })}
              />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label>Требуется антифрод</Label>
              </div>
              <Switch
                checked={form.antifraud_params.antifraud_required}
                onCheckedChange={(checked) => setForm({
                  ...form,
                  antifraud_params: {...form.antifraud_params, antifraud_required: checked}
                })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => onDelete(connection.id)}
            disabled={actionLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}