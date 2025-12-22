import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Clock, Unlock, Shield, Lock } from "lucide-react";
import { User } from "../types";
import { validatePercentageInput, formatDurationFromMinutes, PRIORITY_OPTIONS } from "../utils";
import { useState } from "react";

interface AddConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderId: string;
  traders: User[];
  merchants: User[];
  trafficRecords: any[];
  actionLoading: boolean;
  onSave: (connectionData: any) => Promise<void>;
}

export default function AddConnectionModal({
  open,
  onOpenChange,
  traderId,
  traders,
  merchants,
  trafficRecords,
  actionLoading,
  onSave
}: AddConnectionModalProps) {
  const [form, setForm] = useState({
    merchant_id: "",
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

  const trader = traders.find(t => t.id === traderId);

  const getAvailableMerchants = () => {
    const connectedMerchantIds = trafficRecords
      .filter(record => record.trader_id === traderId)
      .map(record => record.merchant_id);
    
    return merchants.filter(merchant => !connectedMerchantIds.includes(merchant.id));
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    
    if (!form.merchant_id) {
      errors.merchant_id = "Выберите мерчанта";
    }
    
    const reward = parseFloat(form.trader_reward);
    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const merchant = merchants.find(m => m.id === form.merchant_id);
    
    const connectionData = {
      merchant_id: form.merchant_id,
      trader_id: traderId,
      trader_reward: reward / 100, // деление на 100 для перевода процентов в дробь
      trader_priority: parseFloat(form.trader_priority), // Исправлено на parseFloat
      platform_fee: 0.1,
      enabled: true,
      name: form.name || merchant?.username || "",
      traffic_activity_params: form.activity_params,
      traffic_antifraud_params: form.antifraud_params,
      traffic_business_params: {
        merchant_deals_duration: formatDurationFromMinutes(form.merchant_deals_duration_minutes)
      }
    };
    
    await onSave(connectionData);
  };

  const availableMerchants = getAvailableMerchants();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            Добавить подключение для {trader?.username} (@{trader?.login})
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Основное</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
            <TabsTrigger value="security">Безопасность</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Мерчант</Label>
              <Select
                value={form.merchant_id}
                onValueChange={(value) => {
                  setForm({...form, merchant_id: value});
                  if (formErrors.merchant_id) {
                    const newErrors = {...formErrors};
                    delete newErrors.merchant_id;
                    setFormErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={formErrors.merchant_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Выберите мерчанта" />
                </SelectTrigger>
                <SelectContent>
                  {availableMerchants.map(merchant => (
                    <SelectItem key={merchant.id} value={merchant.id}>
                      {merchant.username} (@{merchant.login})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.merchant_id && (
                <p className="text-sm text-red-500">{formErrors.merchant_id}</p>
              )}
            </div>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              "Создать"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}