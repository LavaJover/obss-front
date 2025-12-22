import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Clock, Unlock, Shield, Lock } from "lucide-react";
import { TraderTraffic, User, TrafficRecord, ActivityParams, AntifraudParams, BusinessParams } from "../types";
import { validatePercentageInput, formatDecimal, parseDurationToMinutes, formatDurationFromMinutes, PRIORITY_OPTIONS } from "../utils";
import { useState, useEffect } from "react";

interface TraderSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trader: TraderTraffic | null;
  merchants: User[];
  trafficRecords: TrafficRecord[];
  actionLoading: string | null;
  onSave: (traderId: string, connections: any[]) => Promise<void>;
  onAddConnection: (traderId: string, connection: any) => Promise<void>;
  onDeleteConnection: (connectionId: string) => Promise<void>;
}

export default function TraderSettingsModal({
  open,
  onOpenChange,
  trader,
  merchants,
  trafficRecords,
  actionLoading,
  onSave,
  onAddConnection,
  onDeleteConnection
}: TraderSettingsModalProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState({
    merchant_id: "",
    trader_reward: "",
    trader_priority: "1",
    name: "",
    activity_params: {
      merchant_unlocked: true,
      trader_unlocked: true,
      antifraud_unlocked: true,
      manually_unlocked: true
    } as ActivityParams,
    antifraud_params: {
      antifraud_required: false
    } as AntifraudParams,
    business_params: {
      merchant_deals_duration: "24h0m0s"
    } as BusinessParams,
    merchant_deals_duration_minutes: "1440"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAddConnection, setShowAddConnection] = useState(false);

  // Используем useEffect для инициализации данных
  useEffect(() => {
    if (trader && open) {
      const traderConnections = trafficRecords.filter(record => record.trader_id === trader.trader.id);
      setConnections(traderConnections.map(conn => ({
        id: conn.id,
        merchant_id: conn.merchant_id,
        trader_reward: formatDecimal(conn.trader_reward_percent),
        trader_priority: conn.trader_priority.toString(),
        name: conn.name || "",
        activity_params: conn.activity_params,
        antifraud_params: conn.antifraud_params,
        business_params: conn.business_params,
        merchant_deals_duration_minutes: parseDurationToMinutes(conn.business_params?.merchant_deals_duration || "24h0m0s")
      })));
    } else {
      setConnections([]);
    }
  }, [trader, trafficRecords, open]);

  // Сброс формы при закрытии модалки
  useEffect(() => {
    if (!open) {
      setConnections([]);
      setNewConnection({
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
      setFormErrors({});
      setShowAddConnection(false);
    }
  }, [open]);

  if (!trader) return null;

  const handleConnectionChange = (index: number, field: string, value: any) => {
    const updatedConnections = [...connections];
    
    if (field === 'merchant_deals_duration_minutes') {
      updatedConnections[index] = {
        ...updatedConnections[index],
        merchant_deals_duration_minutes: value,
        business_params: {
          ...updatedConnections[index].business_params,
          merchant_deals_duration: formatDurationFromMinutes(value)
        }
      };
    } else if (field.startsWith('activity_params.')) {
      const paramField = field.split('.')[1] as keyof ActivityParams;
      updatedConnections[index] = {
        ...updatedConnections[index],
        activity_params: {
          ...updatedConnections[index].activity_params,
          [paramField]: value
        }
      };
    } else if (field.startsWith('antifraud_params.')) {
      const paramField = field.split('.')[1] as keyof AntifraudParams;
      updatedConnections[index] = {
        ...updatedConnections[index],
        antifraud_params: {
          ...updatedConnections[index].antifraud_params,
          [paramField]: value
        }
      };
    } else {
      updatedConnections[index] = {
        ...updatedConnections[index],
        [field]: value
      };
    }

    setConnections(updatedConnections);
  };

  const handleAddNewConnection = () => {
    const errors: Record<string, string> = {};
    
    if (!newConnection.merchant_id) {
      errors.merchant_id = "Выберите мерчанта";
    }
    
    const reward = parseFloat(newConnection.trader_reward);
    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setConnections([...connections, { ...newConnection, id: `new-${Date.now()}` }]);
    setNewConnection({
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
    setShowAddConnection(false);
    setFormErrors({});
  };

  const handleSave = async () => {
    await onSave(trader.trader.id, connections);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Настройки трейдера: {trader.trader.username} (@{trader.trader.login})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет подключений к мерчантам
            </div>
          ) : (
            connections.map((connection, index) => {
              const merchant = merchants.find(m => m.id === connection.merchant_id);
              
              return (
                <Card key={connection.id || index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-medium">{merchant?.username || connection.merchant_id}</div>
                      <div className="text-sm text-muted-foreground">@{merchant?.login}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteConnection(connection.id)}
                      disabled={actionLoading !== null}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <Tabs defaultValue="basic" className="w-full">
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
                            value={connection.name}
                            onChange={(e) => handleConnectionChange(index, "name", e.target.value)}
                            placeholder={merchant?.username}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Награда трейдера (%)</Label>
                          <Input
                            type="text"
                            value={connection.trader_reward}
                            onChange={(e) => {
                              const validated = validatePercentageInput(e.target.value);
                              handleConnectionChange(index, "trader_reward", validated);
                            }}
                            placeholder="0.000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Приоритет</Label>
                        <Select
                          value={connection.trader_priority}
                          onValueChange={(value) => handleConnectionChange(index, "trader_priority", value)}
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
                          value={connection.merchant_deals_duration_minutes}
                          onChange={(e) => handleConnectionChange(index, "merchant_deals_duration_minutes", e.target.value)}
                          placeholder="1440"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4" />
                            <Label>Мерчант разблокирован</Label>
                          </div>
                          <Switch
                            checked={connection.activity_params.merchant_unlocked}
                            onCheckedChange={(checked) => handleConnectionChange(index, "activity_params.merchant_unlocked", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4" />
                            <Label>Трейдер разблокирован</Label>
                          </div>
                          <Switch
                            checked={connection.activity_params.trader_unlocked}
                            onCheckedChange={(checked) => handleConnectionChange(index, "activity_params.trader_unlocked", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <Label>Антифрод разблокирован</Label>
                          </div>
                          <Switch
                            checked={connection.activity_params.antifraud_unlocked}
                            onCheckedChange={(checked) => handleConnectionChange(index, "activity_params.antifraud_unlocked", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <Label>Ручная разблокировка</Label>
                          </div>
                          <Switch
                            checked={connection.activity_params.manually_unlocked}
                            onCheckedChange={(checked) => handleConnectionChange(index, "activity_params.manually_unlocked", checked)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <Label>Требуется антифрод</Label>
                        </div>
                        <Switch
                          checked={connection.antifraud_params.antifraud_required}
                          onCheckedChange={(checked) => handleConnectionChange(index, "antifraud_params.antifraud_required", checked)}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              );
            })
          )}
          
          {showAddConnection ? (
            <Card className="p-4 border-dashed">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Мерчант</Label>
                  <Select
                    value={newConnection.merchant_id}
                    onValueChange={(value) => {
                      setNewConnection({...newConnection, merchant_id: value});
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
                      {merchants.map(merchant => (
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
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                      placeholder="Название подключения"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Награда трейдера (%)</Label>
                    <Input
                      type="text"
                      value={newConnection.trader_reward}
                      onChange={(e) => {
                        const validated = validatePercentageInput(e.target.value);
                        setNewConnection({...newConnection, trader_reward: validated});
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
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAddConnection(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleAddNewConnection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setShowAddConnection(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить подключение
            </Button>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading !== null}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={actionLoading !== null}>
            {actionLoading === `trader-save-${trader.trader.id}` ? (
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