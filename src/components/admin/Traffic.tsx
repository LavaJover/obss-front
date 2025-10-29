import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, CheckCheck, Settings, Plus, Trash2, Users, User, ChevronsUpDown, Shield, Lock, Unlock, Clock, History, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

// Добавьте новый интерфейс
interface UnlockHistoryItem {
  id: string;
  trader_id: string;
  admin_id: string;
  reason: string;
  grace_period_hours: number;
  unlocked_at: string;
  created_at: string;
}

interface ActivityParams {
  merchant_unlocked: boolean;
  trader_unlocked: boolean;
  antifraud_unlocked: boolean;
  manually_unlocked: boolean;
}

interface AntifraudParams {
  antifraud_required: boolean;
}

interface BusinessParams {
  merchant_deals_duration: string;
}

interface TrafficRecord {
  id: string;
  trader_id: string;
  merchant_id: string;
  trader_reward_percent: number;
  trader_priority: number;
  platform_fee: number;
  Enabled: boolean;
  name: string;
  activity_params: ActivityParams;
  antifraud_params: AntifraudParams;
  business_params: BusinessParams;
}

interface MerchantTraffic {
  merchant: User;
  platform_fee: number;
  merchant_unlocked: boolean;
  connections_count: number;
  connected_traders: User[];
}

interface TraderTraffic {
  trader: User;
  trader_unlocked: boolean;
  connections: TrafficRecord[];
  grace_period_until?: string; // Добавьте это поле
}

interface MerchantSettingsForm {
  merchant_id: string;
  platform_fee: string;
}

interface TraderConnectionForm {
  merchant_id: string;
  trader_reward: string;
  trader_priority: string;
  name: string;
  activity_params: ActivityParams;
  antifraud_params: AntifraudParams;
  business_params: BusinessParams;
  merchant_deals_duration_minutes: string;
}

interface TraderSettingsForm {
  trader_id: string;
  connections: TraderConnectionForm[];
}

interface SingleConnectionForm {
  connection_id: string;
  merchant_id: string;
  trader_id: string;
  trader_reward: string;
  trader_priority: string;
  name: string;
  activity_params: ActivityParams;
  antifraud_params: AntifraudParams;
  business_params: BusinessParams;
  merchant_deals_duration_minutes: string;
}

interface AntiFraudRule {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface CheckResult {
  rule_name: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

interface AuditLog {
  id: string;
  trader_id: string;
  checked_at: string;
  all_passed: boolean;
  results: CheckResult[];
  created_at: string;
}

const PRIORITY_OPTIONS = [
  { label: "Обычный", value: "1" },
  { label: "Средний", value: "5" },
  { label: "Высокий", value: "15" },
  { label: "Превосходство", value: "1000" }
];

const validatePercentageInput = (value: string): string => {
  const cleanedValue = value.replace(/[^\d.]/g, '');
  const parts = cleanedValue.split('.');
  
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  if (parts.length === 2 && parts[1].length > 3) {
    return parts[0] + '.' + parts[1].substring(0, 3);
  }
  
  return cleanedValue;
};

const parseDurationToMinutes = (duration: string): string => {
  const hourMatch = duration.match(/(\d+)h/);
  const minuteMatch = duration.match(/(\d+)m/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  return (hours * 60 + minutes).toString();
};

const formatDurationFromMinutes = (minutes: string): string => {
  const totalMinutes = parseInt(minutes) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h${mins}m0s`;
};

export default function TrafficTab() {
  const [merchants, setMerchants] = useState<User[]>([]);
  const [traders, setTraders] = useState<User[]>([]);
  const [trafficRecords, setTrafficRecords] = useState<TrafficRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  const [merchantSettingsModal, setMerchantSettingsModal] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [traderSettingsModal, setTraderSettingsModal] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [addConnectionModal, setAddConnectionModal] = useState<{open: boolean; trader_id: string}>({open: false, trader_id: ""});
  const [singleConnectionModal, setSingleConnectionModal] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});
  
  const [deleteMerchantDialog, setDeleteMerchantDialog] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [deleteTraderDialog, setDeleteTraderDialog] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [deleteConnectionDialog, setDeleteConnectionDialog] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});

  const [merchantSettingsForm, setMerchantSettingsForm] = useState<MerchantSettingsForm>({
    merchant_id: "",
    platform_fee: ""
  });

  const [traderSettingsForm, setTraderSettingsForm] = useState<TraderSettingsForm>({
    trader_id: "",
    connections: []
  });

  const [newConnectionForm, setNewConnectionForm] = useState<TraderConnectionForm>({
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

  const [singleConnectionForm, setSingleConnectionForm] = useState<SingleConnectionForm>({
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

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [traderSearchOpen, setTraderSearchOpen] = useState<{[key: string]: boolean}>({});

  // Антифрод state
  const [antiFraudRules, setAntiFraudRules] = useState<AntiFraudRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedTraderForCheck, setSelectedTraderForCheck] = useState<string | null>(null);
  const [checkingTrader, setCheckingTrader] = useState(false);
  const [ruleModal, setRuleModal] = useState<{open: boolean; rule: AntiFraudRule | null}>({open: false, rule: null});
  const [createRuleModal, setCreateRuleModal] = useState(false);
  const [auditHistoryModal, setAuditHistoryModal] = useState<{
    open: boolean; 
    trader_id: string; 
    logs: AuditLog[];
    unlocks: UnlockHistoryItem[]; // ДОБАВИЛИ
  }>({
    open: false, 
    trader_id: "", 
    logs: [],
    unlocks: [] // ДОБАВИЛИ
  });
  
  const [newRuleForm, setNewRuleForm] = useState({
    name: "",
    type: "consecutive_orders",
    config: "{}",
    priority: 1
  });

  // State для модалки разблокировки
  const [unlockModal, setUnlockModal] = useState<{
    open: boolean; 
    trader_id: string; 
    trader_name: string;
  }>({
    open: false, 
    trader_id: "", 
    trader_name: ""
  });

  const [unlockForm, setUnlockForm] = useState({
    reason: "",
    grace_period_minutes: 30, // ИЗМЕНИЛИ с hours на minutes и дефолт 30
    admin_id: ""
  });  

  const fetchData = async () => {
    setLoading(true);
    try {
      const [merchantRes, traderRes, teamLeadRes, trafficRes] = await Promise.all([
        apiClient.get("/admin/users?role=MERCHANT"),
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD"),
        apiClient.get("/admin/traffic/records?page=1&limit=100")
      ]);
      
      const allTraders = [
        ...(traderRes.data.users || []),
        ...(teamLeadRes.data.users || [])
      ];
      
      setMerchants(merchantRes.data.users || []);
      setTraders(allTraders);
      setTrafficRecords(trafficRes.data.traffic_records || []);
    } catch (err: any) {
      console.error("Ошибка при загрузке данных:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные трафика",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAntiFraudData = async () => {
    try {
      const [rulesRes, logsRes] = await Promise.all([
        apiClient.get("/antifraud/rules"),
        apiClient.get("/antifraud/audit-logs?limit=50")
      ]);
      
      setAntiFraudRules(rulesRes.data.rules || []);
      setAuditLogs(logsRes.data.logs || []);
    } catch (err: any) {
      console.error("Ошибка при загрузке данных антифрода:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAntiFraudData();
  }, []);

  const merchantTraffic: MerchantTraffic[] = merchants.map(merchant => {
    const merchantRecords = trafficRecords.filter(record => record.merchant_id === merchant.id);
    const platformFee = merchantRecords.length > 0 ? merchantRecords[0].platform_fee : 0;
    const merchant_unlocked = merchantRecords.length > 0 ? merchantRecords[0].activity_params.merchant_unlocked : false;
    const connections_count = merchantRecords.length;
    
    const connectedTraders = merchantRecords.map(record => {
      const trader = traders.find(t => t.id === record.trader_id);
      return trader!;
    }).filter(trader => trader !== undefined);

    return {
      merchant,
      platform_fee: platformFee,
      merchant_unlocked,
      connections_count,
      connected_traders: connectedTraders
    };
  });

  const traderTraffic: TraderTraffic[] = traders.map(trader => {
    const connections = trafficRecords.filter(record => record.trader_id === trader.id);
    const trader_unlocked = connections.length > 0 ? connections[0].activity_params.trader_unlocked : false;

    return {
      trader,
      trader_unlocked,
      connections
    };
  });

  const formatDecimal = (value: number): string => {
    return (value * 100).toFixed(3);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [field]: false }));
      }, 2000);
      toast({
        title: "Скопировано",
        description: "ID скопирован в буфер обмена"
      });
    } catch (err) {
      console.error("Ошибка при копировании:", err);
    }
  };

  const renderUserInfo = (user: User) => {
    const shortId = user.id.length > 8 ? `${user.id.substring(0, 8)}...` : user.id;
    
    return (
      <div className="space-y-1">
        <div className="font-medium">{user.username}</div>
        <div className="text-sm text-muted-foreground">@{user.login}</div>
        <div 
          className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onClick={() => copyToClipboard(user.id, `user-${user.id}`)}
          title="Нажмите, чтобы скопировать ID"
        >
          <span>{shortId}</span>
          {copyStatus[`user-${user.id}`] ? (
            <CheckCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </div>
      </div>
    );
  };

  // АНТИФРОД ФУНКЦИИ
  const handleCheckTrader = async (traderId: string) => {
    setCheckingTrader(true);
    setSelectedTraderForCheck(traderId);
    try {
      const response = await apiClient.post(`/antifraud/traders/${traderId}/check`);
      
      if (response.data.all_passed) {
        toast({
          title: "Проверка пройдена",
          description: "Трейдер прошёл все проверки антифрода",
        });
      } else {
        toast({
          title: "Проверка не пройдена",
          description: `Провалены правила: ${response.data.failed_rules.join(", ")}`,
          variant: "destructive"
        });
      }
      
      await fetchAntiFraudData();
    } catch (err: any) {
      console.error("Ошибка при проверке трейдера:", err);
      toast({
        title: "Ошибка проверки",
        description: err.response?.data?.error || "Не удалось проверить трейдера",
        variant: "destructive"
      });
    } finally {
      setCheckingTrader(false);
      setSelectedTraderForCheck(null);
    }
  };

  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    setActionLoading(`rule-toggle-${ruleId}`);
    try {
      await apiClient.patch(`/antifraud/rules/${ruleId}`, {
        is_active: !currentStatus
      });
      
      toast({
        title: "Правило обновлено",
        description: `Правило ${!currentStatus ? 'активировано' : 'деактивировано'}`,
      });
      
      await fetchAntiFraudData();
    } catch (err: any) {
      console.error("Ошибка при обновлении правила:", err);
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.error || "Не удалось обновить правило",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRule = async () => {
    setActionLoading("create-rule");
    try {
      let config = {};
      try {
        config = JSON.parse(newRuleForm.config);
      } catch {
        toast({
          title: "Ошибка",
          description: "Неверный формат JSON в конфигурации",
          variant: "destructive"
        });
        setActionLoading(null);
        return;
      }

      await apiClient.post("/antifraud/rules", {
        name: newRuleForm.name,
        type: newRuleForm.type,
        config: config,
        priority: newRuleForm.priority
      });
      
      toast({
        title: "Правило создано",
        description: "Новое правило успешно создано",
      });
      
      setCreateRuleModal(false);
      setNewRuleForm({
        name: "",
        type: "consecutive_orders",
        config: "{}",
        priority: 1
      });
      
      await fetchAntiFraudData();
    } catch (err: any) {
      console.error("Ошибка при создании правила:", err);
      toast({
        title: "Ошибка создания",
        description: err.response?.data?.error || "Не удалось создать правило",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setActionLoading(`delete-rule-${ruleId}`);
    try {
      await apiClient.delete(`/antifraud/rules/${ruleId}`);
      
      toast({
        title: "Правило удалено",
        description: "Правило успешно удалено",
      });
      
      await fetchAntiFraudData();
    } catch (err: any) {
      console.error("Ошибка при удалении правила:", err);
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.error || "Не удалось удалить правило",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Обновите функцию загрузки истории
  const handleViewAuditHistory = async (traderId: string) => {
    try {
      const [checksResponse, unlocksResponse] = await Promise.all([
        apiClient.get(`/antifraud/traders/${traderId}/audit-history?limit=20`),
        apiClient.get(`/antifraud/traders/${traderId}/unlock-history?limit=20`)
      ]);

      setAuditHistoryModal({
        open: true,
        trader_id: traderId,
        logs: checksResponse.data.logs || [],
        unlocks: unlocksResponse.data.items || []
      });
    } catch (err: any) {
      console.error("Ошибка при загрузке истории:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю проверок",
        variant: "destructive"
      });
    }
  };

  // Ручная разблокировка трейдера
  const handleManualUnlock = async () => {
    if (!unlockForm.reason.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите причину разблокировки",
        variant: "destructive"
      });
      return;
    }
  
    const adminId = "temp-admin-id"; // TODO: Получите из AuthContext
  
    setActionLoading(`unlock-${unlockModal.trader_id}`);
    try {
      const response = await apiClient.post(
        `/antifraud/traders/${unlockModal.trader_id}/manual-unlock`, 
        {
          admin_id: adminId,
          reason: unlockForm.reason,
          grace_period_hours: Math.ceil(unlockForm.grace_period_minutes / 60) // Конвертируем минуты в часы
        }
      );
      
      const gracePeriodUntil = new Date(response.data.grace_period_until);
      
      toast({
        title: "Трейдер разблокирован",
        description: `Грейс-период действует до ${gracePeriodUntil.toLocaleString('ru-RU')}`,
      });
      
      setUnlockModal({open: false, trader_id: "", trader_name: ""});
      setUnlockForm({reason: "", grace_period_minutes: 30, admin_id: ""});
      
      await Promise.all([fetchData(), fetchAntiFraudData()]);
    } catch (err: any) {
      console.error("Ошибка при разблокировке:", err);
      toast({
        title: "Ошибка разблокировки",
        description: err.response?.data?.error || "Не удалось разблокировать трейдера",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  

  // MERCHANT FUNCTIONS
  const handleMerchantToggle = async (merchantTraffic: MerchantTraffic) => {
    setActionLoading(`merchant-toggle-${merchantTraffic.merchant.id}`);
    try {
      await apiClient.patch(`/traffic/merchants/${merchantTraffic.merchant.id}?unlocked=${!merchantTraffic.merchant_unlocked}`);
      
      toast({
        title: "Статус обновлён",
        description: `Трафик для мерчанта ${merchantTraffic.merchant.username} ${!merchantTraffic.merchant_unlocked ? 'разблокирован' : 'заблокирован'}`,
      });
      
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при обновлении статуса мерчанта:", err);
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.message || "Не удалось обновить статус трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openMerchantSettings = (merchantTraffic: MerchantTraffic) => {
    setMerchantSettingsForm({
      merchant_id: merchantTraffic.merchant.id,
      platform_fee: formatDecimal(merchantTraffic.platform_fee)
    });
    setMerchantSettingsModal({ open: true, merchant: merchantTraffic });
    setFormErrors({});
  };

  const handleMerchantSettingsSave = async () => {
    const platformFee = parseFloat(merchantSettingsForm.platform_fee);
    if (isNaN(platformFee) || platformFee < 0) {
      setFormErrors({ platform_fee: "Введите корректную комиссию" });
      return;
    }

    setActionLoading(`merchant-save-${merchantSettingsForm.merchant_id}`);
    try {
      const updatePromises = trafficRecords
        .filter(record => record.merchant_id === merchantSettingsForm.merchant_id)
        .map(record => 
          apiClient.patch("/admin/traffic/edit", {
            id: record.id,
            platform_fee: platformFee / 100
          })
        );

      await Promise.all(updatePromises);
      
      toast({
        title: "Настройки сохранены",
        description: "Настройки мерчанта успешно обновлены",
      });
      
      setMerchantSettingsModal({ open: false, merchant: null });
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при сохранении настроек мерчанта:", err);
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!deleteMerchantDialog.merchant) return;

    setActionLoading(`merchant-delete-${deleteMerchantDialog.merchant.merchant.id}`);
    try {
      const deletePromises = trafficRecords
        .filter(record => record.merchant_id === deleteMerchantDialog.merchant!.merchant.id)
        .map(record => apiClient.delete(`/admin/traffic/${record.id}`));

      await Promise.all(deletePromises);
      
      toast({
        title: "Мерчант удалён",
        description: `Все записи трафика для ${deleteMerchantDialog.merchant.merchant.username} удалены`,
      });
      
      setDeleteMerchantDialog({ open: false, merchant: null });
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при удалении мерчанта:", err);
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.message || "Не удалось удалить записи трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // TRADER FUNCTIONS
  const handleTraderToggle = async (traderTraffic: TraderTraffic) => {
    setActionLoading(`trader-toggle-${traderTraffic.trader.id}`);
    try {
      await apiClient.patch(`/traffic/traders/${traderTraffic.trader.id}?unlocked=${!traderTraffic.trader_unlocked}`);
      
      toast({
        title: "Статус обновлён",
        description: `Трафик для трейдера ${traderTraffic.trader.username} ${!traderTraffic.trader_unlocked ? 'разблокирован' : 'заблокирован'}`,
      });
      
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при обновлении статуса трейдера:", err);
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.message || "Не удалось обновить статус трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivityParamToggle = async (trafficId: string, paramName: keyof ActivityParams, currentValue: boolean) => {
    setActionLoading(`param-toggle-${trafficId}-${paramName}`);
    try {
      let endpoint = "";
      
      switch(paramName) {
        case 'manually_unlocked':
          endpoint = `/traffic/${trafficId}/manual?unlocked=${!currentValue}`;
          break;
        case 'antifraud_unlocked':
          const record = trafficRecords.find(r => r.id === trafficId);
          if (record) {
            endpoint = `/traffic/antifraud/${record.trader_id}?unlocked=${!currentValue}`;
          }
          break;
        default:
          throw new Error(`Unsupported param: ${paramName}`);
      }
      
      await apiClient.patch(endpoint);
      
      toast({
        title: "Статус обновлён",
        description: "Параметр успешно изменён",
      });
      
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при обновлении параметра:", err);
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.message || "Не удалось обновить параметр",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openTraderSettings = (traderTraffic: TraderTraffic) => {
    const connectionsForm: TraderConnectionForm[] = traderTraffic.connections.map(connection => ({
      merchant_id: connection.merchant_id,
      trader_reward: formatDecimal(connection.trader_reward_percent),
      trader_priority: connection.trader_priority.toString(),
      name: connection.name || "",
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
    }));

    setTraderSettingsForm({
      trader_id: traderTraffic.trader.id,
      connections: connectionsForm
    });
    setTraderSettingsModal({ open: true, trader: traderTraffic });
    setFormErrors({});
  };

  const handleTraderConnectionUpdate = (index: number, field: string, value: any) => {
    const updatedConnections = [...traderSettingsForm.connections];
    
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

    setTraderSettingsForm({
      ...traderSettingsForm,
      connections: updatedConnections
    });

    if (formErrors[`connection-${index}-${field}`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`connection-${index}-${field}`];
      setFormErrors(newErrors);
    }
  };

  const handleTraderSettingsSave = async () => {
    const errors: {[key: string]: string} = {};
  
    traderSettingsForm.connections.forEach((connection, index) => {
      const reward = parseFloat(connection.trader_reward);
      const priority = parseInt(connection.trader_priority);
  
      if (isNaN(reward) || reward < 0) {
        errors[`connection-${index}-trader_reward`] = "Введите корректную награду";
      }
  
      if (isNaN(priority) || priority < 0) {
        errors[`connection-${index}-trader_priority`] = "Введите корректный приоритет";
      }
  
      const merchantRecord = trafficRecords.find(record => 
        record.merchant_id === connection.merchant_id && 
        record.trader_id === traderSettingsForm.trader_id
      );
      
      if (merchantRecord && reward > merchantRecord.platform_fee * 100) {
        errors[`connection-${index}-trader_reward`] = "Награда не может превышать комиссию платформы";
      }
    });
  
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
  
    setActionLoading(`trader-save-${traderSettingsForm.trader_id}`);
    try {
      const updatePromises = traderSettingsForm.connections.map(connection => {
        const originalRecord = trafficRecords.find(record => 
          record.merchant_id === connection.merchant_id && 
          record.trader_id === traderSettingsForm.trader_id
        );
  
        if (!originalRecord) return Promise.resolve();
  
        return apiClient.patch("/admin/traffic/edit", {
          id: originalRecord.id,
          trader_reward: parseFloat(connection.trader_reward) / 100,
          trader_priority: parseInt(connection.trader_priority),
          name: connection.name,
          activity_params: connection.activity_params,
          antifraud_params: connection.antifraud_params,
          business_params: connection.business_params
        });
      });
  
      await Promise.all(updatePromises);
      
      toast({
        title: "Настройки сохранены",
        description: "Настройки трейдера успешно обновлены",
      });

      // Закрываем модалку
      setTraderSettingsModal({ open: false, trader: null });
      
      // КРИТИЧНО: Сначала обновляем данные с сервера
      await fetchData();
      
      // КРИТИЧНО: ПОСЛЕ обновления данных открываем модалку с НОВЫМИ данными
      const updatedTraderData = traderTraffic.find(t => t.trader.id === traderSettingsForm.trader_id);
      if (updatedTraderData) {
        // Формируем обновленную форму с новыми данными
        const updatedConnectionsForm: TraderConnectionForm[] = updatedTraderData.connections.map(connection => ({
          merchant_id: connection.merchant_id,
          trader_reward: formatDecimal(connection.trader_reward_percent),
          trader_priority: connection.trader_priority.toString(),
          name: connection.name || "",
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
        }));
  
        // Обновляем форму с актуальными данными
        setTraderSettingsForm({
          trader_id: updatedTraderData.trader.id,
          connections: updatedConnectionsForm
        });
      }
    } catch (err: any) {
      console.error("Ошибка при сохранении настроек трейдера:", err);
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  

  const openAddConnectionModal = (trader_id: string) => {
    setNewConnectionForm({
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
    setAddConnectionModal({ open: true, trader_id });
    setFormErrors({});
  };

  const handleAddConnection = async () => {
    const reward = parseFloat(newConnectionForm.trader_reward);
    const errors: {[key: string]: string} = {};

    if (!newConnectionForm.merchant_id) {
      errors.merchant_id = "Выберите мерчанта";
    }

    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }

    const existingConnection = trafficRecords.find(record => 
      record.merchant_id === newConnectionForm.merchant_id && 
      record.trader_id === addConnectionModal.trader_id
    );

    if (existingConnection) {
      errors.merchant_id = "Этот мерчант уже подключен к данному трейдеру";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setActionLoading(`add-connection-${addConnectionModal.trader_id}`);
    try {
      const merchantRecord = trafficRecords.find(record => record.merchant_id === newConnectionForm.merchant_id);
      const platformFee = merchantRecord ? merchantRecord.platform_fee : 0.1;
      const merchantName = merchants.find(m => m.id === newConnectionForm.merchant_id)?.username || "";

      await apiClient.post("/admin/traffic/create", {
        merchant_id: newConnectionForm.merchant_id,
        trader_id: addConnectionModal.trader_id,
        trader_reward: reward / 100,
        trader_priority: parseInt(newConnectionForm.trader_priority),
        platform_fee: platformFee,
        enabled: true,
        name: newConnectionForm.name || merchantName,
        traffic_activity_params: newConnectionForm.activity_params,
        traffic_antifraud_params: newConnectionForm.antifraud_params,
        traffic_business_params: {
          merchant_deals_duration: formatDurationFromMinutes(newConnectionForm.merchant_deals_duration_minutes)
        }
      });
      
      toast({
        title: "Подключение создано",
        description: "Новое подключение успешно создано",
      });
      
      await fetchData();
      
      const newConnection: TraderConnectionForm = {
        merchant_id: newConnectionForm.merchant_id,
        trader_reward: newConnectionForm.trader_reward,
        trader_priority: newConnectionForm.trader_priority,
        name: newConnectionForm.name,
        activity_params: newConnectionForm.activity_params,
        antifraud_params: newConnectionForm.antifraud_params,
        business_params: newConnectionForm.business_params,
        merchant_deals_duration_minutes: newConnectionForm.merchant_deals_duration_minutes
      };
      
      setTraderSettingsForm(prev => ({
        ...prev,
        connections: [...prev.connections, newConnection]
      }));
      
      setAddConnectionModal({ open: false, trader_id: "" });
    } catch (err: any) {
      console.error("Ошибка при создании подключения:", err);
      toast({
        title: "Ошибка создания",
        description: err.response?.data?.message || "Не удалось создать подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTrader = async () => {
    if (!deleteTraderDialog.trader) return;

    setActionLoading(`trader-delete-${deleteTraderDialog.trader.trader.id}`);
    try {
      const deletePromises = deleteTraderDialog.trader.connections.map(connection =>
        apiClient.delete(`/admin/traffic/${connection.id}`)
      );

      await Promise.all(deletePromises);
      
      toast({
        title: "Трейдер удалён",
        description: `Все записи трафика для ${deleteTraderDialog.trader.trader.username} удалены`,
      });
      
      setDeleteTraderDialog({ open: false, trader: null });
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при удалении трейдера:", err);
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.message || "Не удалось удалить записи трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnectionInTraderModal = async (connectionIndex: number) => {
    const connection = traderSettingsModal.trader?.connections[connectionIndex];
    if (!connection) return;

    setActionLoading(`connection-delete-${connection.id}`);
    try {
      await apiClient.delete(`/admin/traffic/${connection.id}`);
      
      toast({
        title: "Подключение удалено",
        description: "Подключение успешно удалено",
      });
      
      const updatedConnections = traderSettingsForm.connections.filter((_, i) => i !== connectionIndex);
      setTraderSettingsForm({
        ...traderSettingsForm,
        connections: updatedConnections
      });
      
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при удалении подключения:", err);
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.message || "Не удалось удалить подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnection = async () => {
    if (!deleteConnectionDialog.connection) return;

    setActionLoading(`connection-delete-${deleteConnectionDialog.connection.id}`);
    try {
      await apiClient.delete(`/admin/traffic/${deleteConnectionDialog.connection.id}`);
      
      toast({
        title: "Подключение удалено",
        description: "Подключение успешно удалено",
      });
      
      setDeleteConnectionDialog({ open: false, connection: null });
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при удалении подключения:", err);
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.message || "Не удалось удалить подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openSingleConnectionModal = (connection: TrafficRecord) => {
    const merchant = merchants.find(m => m.id === connection.merchant_id);
    const trader = traders.find(t => t.id === connection.trader_id);
    
    if (!merchant || !trader) return;

    setSingleConnectionForm({
      connection_id: connection.id,
      merchant_id: connection.merchant_id,
      trader_id: connection.trader_id,
      trader_reward: formatDecimal(connection.trader_reward_percent),
      trader_priority: connection.trader_priority.toString(),
      name: connection.name || "",
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
    
    setSingleConnectionModal({ open: true, connection });
    setFormErrors({});
  };

  const handleSingleConnectionSave = async () => {
    const reward = parseFloat(singleConnectionForm.trader_reward);
    const priority = parseInt(singleConnectionForm.trader_priority);
    const errors: {[key: string]: string} = {};

    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }

    if (isNaN(priority) || priority < 0) {
      errors.trader_priority = "Введите корректный приоритет";
    }

    const platformFee = trafficRecords.find(record => 
      record.id === singleConnectionForm.connection_id
    )?.platform_fee || 0;

    if (reward > platformFee * 100) {
      errors.trader_reward = "Награда не может превышать комиссию платформы";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setActionLoading(`single-connection-save-${singleConnectionForm.connection_id}`);
    try {
      await apiClient.patch("/admin/traffic/edit", {
        id: singleConnectionForm.connection_id,
        trader_reward: reward / 100,
        trader_priority: priority,
        name: singleConnectionForm.name,
        activity_params: singleConnectionForm.activity_params,
        antifraud_params: singleConnectionForm.antifraud_params,
        business_params: {
          merchant_deals_duration: formatDurationFromMinutes(singleConnectionForm.merchant_deals_duration_minutes)
        }
      });
      
      toast({
        title: "Настройки сохранены",
        description: "Настройки подключения успешно обновлены",
      });
      
      setSingleConnectionModal({ open: false, connection: null });
      await fetchData();
    } catch (err: any) {
      console.error("Ошибка при сохранении настроек подключения:", err);
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getAvailableMerchants = (trader_id: string) => {
    const connectedMerchantIds = trafficRecords
      .filter(record => record.trader_id === trader_id)
      .map(record => record.merchant_id);

    return merchants.filter(merchant => !connectedMerchantIds.includes(merchant.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Загрузка данных трафика...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Управление трафиком</h1>
      </div>

      <Tabs defaultValue="traffic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="traffic">Трафик</TabsTrigger>
          <TabsTrigger value="antifraud">Антифрод</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
        </TabsList>

        {/* ТРАФИК ВКЛАДКА */}
        <TabsContent value="traffic" className="space-y-6">
          {/* Merchants Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Мерчанты
              </CardTitle>
            </CardHeader>
            <CardContent>
              {merchantTraffic.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет мерчантов для отображения
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Мерчант</TableHead>
                      <TableHead>Комиссия платформы</TableHead>
                      <TableHead>Подключения</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchantTraffic.map((merchant) => (
                      <TableRow key={merchant.merchant.id}>
                        <TableCell>{renderUserInfo(merchant.merchant)}</TableCell>
                        <TableCell className="font-mono">{formatDecimal(merchant.platform_fee)}%</TableCell>
                        <TableCell>
                          <Popover open={traderSearchOpen[merchant.merchant.id] || false} onOpenChange={(open) => setTraderSearchOpen(prev => ({...prev, [merchant.merchant.id]: open}))}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {merchant.connected_traders.length > 0 
                                  ? `Выбрать трейдера (${merchant.connected_traders.length})`
                                  : "Нет подключений"
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Поиск по имени, логину или ID..." />
                                <CommandList>
                                  <CommandEmpty>Трейдеры не найдены</CommandEmpty>
                                  <CommandGroup>
                                    {merchant.connected_traders.map((trader) => {
                                      const connection = trafficRecords.find(record => 
                                        record.merchant_id === merchant.merchant.id && 
                                        record.trader_id === trader.id
                                      );
                                      
                                      return (
                                        <CommandItem
                                          key={trader.id}
                                          value={`${trader.username} ${trader.login} ${trader.id}`}
                                          onSelect={() => {
                                            if (connection) {
                                              openSingleConnectionModal(connection);
                                              setTraderSearchOpen(prev => ({...prev, [merchant.merchant.id]: false}));
                                            }
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span>{trader.username} (@{trader.login})</span>
                                            <span className="text-xs text-muted-foreground">
                                              Награда: {connection ? formatDecimal(connection.trader_reward_percent) : '0.000'}%, 
                                              Приоритет: {connection?.trader_priority || 0}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Badge variant={merchant.merchant_unlocked ? "default" : "secondary"}>
                            {merchant.merchant_unlocked ? "Разблокирован" : "Заблокирован"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Switch
                              checked={merchant.merchant_unlocked}
                              onCheckedChange={() => handleMerchantToggle(merchant)}
                              disabled={actionLoading === `merchant-toggle-${merchant.merchant.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMerchantSettings(merchant)}
                              disabled={actionLoading !== null}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteMerchantDialog({ open: true, merchant })}
                              disabled={actionLoading !== null}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Traders Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Трейдеры и Тимлиды
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traderTraffic.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет трейдеров для отображения
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Трейдер</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Параметры</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traderTraffic.map((trader) => {
                      const firstConnection = trader.connections[0];
                      return (
                        <TableRow key={trader.trader.id}>
                          <TableCell>{renderUserInfo(trader.trader)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={trader.trader_unlocked ? "default" : "secondary"}>
                                {trader.trader_unlocked ? "Разблокирован" : "Заблокирован"}
                              </Badge>

                              {/* Индикатор грейс-периода - если нужно */}
                              {/* Для этого нужно добавить поле grace_period_until в TraderTraffic */}
                              {trader.grace_period_until && new Date(trader.grace_period_until) > new Date() && (
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Грейс-период
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
  {firstConnection && (
    <div className="space-y-2">
      {/* Индикатор - Трейдер включен */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Трейдер:</Label>
          <Badge 
            variant={firstConnection.activity_params.trader_unlocked ? "default" : "secondary"}
            className="text-xs"
          >
            {firstConnection.activity_params.trader_unlocked ? (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                Вкл
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Выкл
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Индикатор - Мерчант включен
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Мерчант:</Label>
          <Badge 
            variant={firstConnection.activity_params.merchant_unlocked ? "default" : "secondary"}
            className="text-xs"
          >
            {firstConnection.activity_params.merchant_unlocked ? (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                Вкл
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Выкл
              </>
            )}
          </Badge>
        </div>
      </div> */}

      {/* Индикатор - Антифрод */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Антифрод:</Label>
          <Badge 
            variant={firstConnection.activity_params.antifraud_unlocked ? "default" : "destructive"}
            className="text-xs"
          >
            {firstConnection.activity_params.antifraud_unlocked ? (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Разблок
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Заблок
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Switch - Только для ручного управления */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Вручную:</Label>
          <Switch
            checked={firstConnection.activity_params.manually_unlocked}
            onCheckedChange={() => handleActivityParamToggle(
              firstConnection.id,
              'manually_unlocked',
              firstConnection.activity_params.manually_unlocked
            )}
            disabled={actionLoading?.startsWith('param-toggle')}
          />
        </div>
      </div>
    </div>
  )}
</TableCell>

                          <TableCell>
                            <div className="flex gap-2">
                              {/* Существующие кнопки */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckTrader(trader.trader.id)}
                                disabled={checkingTrader && selectedTraderForCheck === trader.trader.id}
                                title="Проверить антифродом"
                              >
                                {checkingTrader && selectedTraderForCheck === trader.trader.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Shield className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAuditHistory(trader.trader.id)}
                                title="История проверок"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              
                              {/* НОВАЯ КНОПКА - Ручная разблокировка */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUnlockModal({
                                  open: true, 
                                  trader_id: trader.trader.id,
                                  trader_name: trader.trader.username
                                })}
                                title="Ручная разблокировка"
                                disabled={trader.trader_unlocked} // Доступна только если заблокирован
                                className={!trader.trader_unlocked ? "border-orange-500 text-orange-500 hover:bg-orange-50" : ""}
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                              
                              {/* Остальные существующие кнопки */}
                              {/* <Switch
                                checked={trader.trader_unlocked}
                                onCheckedChange={() => handleTraderToggle(trader)}
                                disabled={actionLoading === `trader-toggle-${trader.trader.id}`}
                              /> */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTraderSettings(trader)}
                                disabled={actionLoading !== null}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTraderDialog({ open: true, trader })}
                                disabled={actionLoading !== null}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                              
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* АНТИФРОД ВКЛАДКА */}
        <TabsContent value="antifraud" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Правила антифрода
                </CardTitle>
                <Button onClick={() => setCreateRuleModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать правило
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {antiFraudRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет правил антифрода
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {antiFraudRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.type}</Badge>
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Активно" : "Неактивно"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                              disabled={actionLoading === `rule-toggle-${rule.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRuleModal({open: true, rule})}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={actionLoading === `delete-rule-${rule.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* АУДИТ ВКЛАДКА */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                История проверок
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет истории проверок
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Трейдер</TableHead>
                      <TableHead>Дата проверки</TableHead>
                      <TableHead>Результат</TableHead>
                      <TableHead>Детали</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const trader = traders.find(t => t.id === log.trader_id);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            {trader ? renderUserInfo(trader) : log.trader_id}
                          </TableCell>
                          <TableCell>
                            {new Date(log.checked_at).toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.all_passed ? "default" : "destructive"}>
                              {log.all_passed ? "Пройдено" : "Провалено"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Посмотреть
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96">
                                <div className="space-y-2">
                                  {log.results.map((result, idx) => (
                                    <div key={idx} className="border-b pb-2">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{result.rule_name}</span>
                                        <Badge variant={result.passed ? "default" : "destructive"} className="text-xs">
                                          {result.passed ? "✓" : "✗"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Modal */}
      <Dialog open={createRuleModal} onOpenChange={setCreateRuleModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Создать правило антифрода</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newRuleForm.name}
                onChange={(e) => setNewRuleForm({...newRuleForm, name: e.target.value})}
                placeholder="Название правила"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={newRuleForm.type}
                onValueChange={(value) => setNewRuleForm({...newRuleForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consecutive_orders">Последовательные заказы</SelectItem>
                  <SelectItem value="canceled_orders">Отмененные заказы</SelectItem>
                  <SelectItem value="order_amount">Сумма заказов</SelectItem>
                  <SelectItem value="time_pattern">Временной паттерн</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Конфигурация (JSON)</Label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md font-mono text-sm"
                value={newRuleForm.config}
                onChange={(e) => setNewRuleForm({...newRuleForm, config: e.target.value})}
                placeholder='{"max_consecutive": 5, "time_window_minutes": 60}'
              />
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Input
                type="number"
                value={newRuleForm.priority}
                onChange={(e) => setNewRuleForm({...newRuleForm, priority: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={actionLoading === "create-rule"}
            >
              {actionLoading === "create-rule" ? (
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

      {/* Rule Details Modal */}
      <Dialog open={ruleModal.open} onOpenChange={(open) => setRuleModal({open, rule: null})}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Детали правила</DialogTitle>
          </DialogHeader>
          {ruleModal.rule && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Название</Label>
                <p className="mt-1">{ruleModal.rule.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Тип</Label>
                <p className="mt-1">
                  <Badge variant="outline">{ruleModal.rule.type}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Конфигурация</Label>
                <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(ruleModal.rule.config, null, 2)}
                </pre>
              </div>
              <div>
                <Label className="text-sm font-medium">Приоритет</Label>
                <p className="mt-1">{ruleModal.rule.priority}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Статус</Label>
                <p className="mt-1">
                  <Badge variant={ruleModal.rule.is_active ? "default" : "secondary"}>
                    {ruleModal.rule.is_active ? "Активно" : "Неактивно"}
                  </Badge>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleModal({open: false, rule: null})}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit History Modal */}
{/* Audit History Modal - ОБНОВЛЕННАЯ ВЕРСИЯ */}
<Dialog open={auditHistoryModal.open} onOpenChange={(open) => {
  if (!open) {
    setAuditHistoryModal({open: false, trader_id: "", logs: [], unlocks: []});
  }
}}>
  <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <History className="h-5 w-5" />
        История проверок трейдера
      </DialogTitle>
    </DialogHeader>
    
    <Tabs defaultValue="checks" className="flex-1 overflow-hidden flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="checks">
          Проверки антифрода ({auditHistoryModal.logs.length})
        </TabsTrigger>
        <TabsTrigger value="unlocks">
          Ручные разблокировки ({auditHistoryModal.unlocks.length})
        </TabsTrigger>
      </TabsList>

      {/* Вкладка с проверками */}
      <TabsContent value="checks" className="flex-1 overflow-y-auto mt-4 space-y-4">
        {auditHistoryModal.logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет истории проверок для этого трейдера
          </div>
        ) : (
          auditHistoryModal.logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {new Date(log.checked_at).toLocaleString('ru-RU')}
                </span>
                <Badge variant={log.all_passed ? "default" : "destructive"}>
                  {log.all_passed ? "Пройдено" : "Провалено"}
                </Badge>
              </div>
              <div className="space-y-2">
                {log.results.map((result, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start justify-between border-l-2 pl-3 py-1" 
                    style={{borderColor: result.passed ? '#22c55e' : '#ef4444'}}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{result.rule_name}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                    <Badge variant={result.passed ? "default" : "destructive"} className="text-xs ml-2">
                      {result.passed ? "✓" : "✗"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </TabsContent>

      {/* НОВАЯ вкладка с разблокировками */}
      <TabsContent value="unlocks" className="flex-1 overflow-y-auto mt-4 space-y-4">
        {auditHistoryModal.unlocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Unlock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Этот трейдер ещё не разблокировался вручную</p>
          </div>
        ) : (
          auditHistoryModal.unlocks.map((unlock) => {
            const trader = traders.find(t => t.id === unlock.trader_id);
            const admin = traders.find(t => t.id === unlock.admin_id); // Или админы из отдельного списка
            
            return (
              <Card key={unlock.id} className="p-4 border-l-4 border-orange-500">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Unlock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ручная разблокировка</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(unlock.unlocked_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {unlock.grace_period_hours}ч
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Администратор</p>
                      <p className="font-medium">{admin?.username || unlock.admin_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Грейс-период</p>
                      <p className="font-medium">{unlock.grace_period_hours} часов</p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Причина разблокировки:</p>
                    <p className="text-sm">{unlock.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Создано: {new Date(unlock.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </TabsContent>
    </Tabs>
    
    <DialogFooter className="mt-4">
      <Button 
        variant="outline" 
        onClick={() => setAuditHistoryModal({open: false, trader_id: "", logs: [], unlocks: []})}
      >
        Закрыть
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* ВСЕ ОСТАЛЬНЫЕ МОДАЛКИ из прошлого кода - они остаются без изменений */}
      {/* Здесь должны быть: Merchant Settings Modal, Trader Settings Modal, Add Connection Modal, 
          Single Connection Modal, и все Alert Dialogs для удаления */}
      
            {/* Merchant Settings Modal */}
            <Dialog open={merchantSettingsModal.open} onOpenChange={(open) => setMerchantSettingsModal({open, merchant: null})}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Настройки мерчанта</DialogTitle>
          </DialogHeader>
          {merchantSettingsModal.merchant && (
            <div className="mt-2 mb-4">
              {renderUserInfo(merchantSettingsModal.merchant.merchant)}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform-fee">Комиссия платформы (%)</Label>
              <Input
                id="platform-fee"
                type="text"
                value={merchantSettingsForm.platform_fee}
                onChange={(e) => {
                  const validated = validatePercentageInput(e.target.value);
                  setMerchantSettingsForm({...merchantSettingsForm, platform_fee: validated});
                  if (formErrors.platform_fee) {
                    const newErrors = {...formErrors};
                    delete newErrors.platform_fee;
                    setFormErrors(newErrors);
                  }
                }}
                placeholder="0.000"
                className={formErrors.platform_fee ? "border-red-500" : ""}
              />
              {formErrors.platform_fee && (
                <p className="text-sm text-red-500">{formErrors.platform_fee}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMerchantSettingsModal({open: false, merchant: null})} disabled={actionLoading !== null}>
              Отмена
            </Button>
            <Button onClick={handleMerchantSettingsSave} disabled={actionLoading === `merchant-save-${merchantSettingsForm.merchant_id}`}>
              {actionLoading === `merchant-save-${merchantSettingsForm.merchant_id}` ? (
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

      {/* Trader Settings Modal */}
      <Dialog open={traderSettingsModal.open} onOpenChange={(open) => setTraderSettingsModal({open, trader: null})}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройки трейдера</DialogTitle>
          </DialogHeader>
          {traderSettingsModal.trader && (
            <div className="mt-2 mb-4">
              {renderUserInfo(traderSettingsModal.trader.trader)}
            </div>
          )}
          <div className="space-y-4 py-4">
            {traderSettingsForm.connections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет подключений к мерчантам
              </div>
            ) : (
              traderSettingsForm.connections.map((connection, index) => {
                const merchant = merchants.find(m => m.id === connection.merchant_id);
                if (!merchant) return null;
                
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        {renderUserInfo(merchant)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConnectionInTraderModal(index)}
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

                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                              value={connection.name}
                              onChange={(e) => handleTraderConnectionUpdate(index, "name", e.target.value)}
                              placeholder={merchant.username}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Награда трейдера (%)</Label>
                            <Input
                              type="text"
                              value={connection.trader_reward}
                              onChange={(e) => {
                                const validated = validatePercentageInput(e.target.value);
                                handleTraderConnectionUpdate(index, "trader_reward", validated);
                              }}
                              placeholder="0.000"
                              className={formErrors[`connection-${index}-trader_reward`] ? "border-red-500" : ""}
                            />
                            {formErrors[`connection-${index}-trader_reward`] && (
                              <p className="text-sm text-red-500">{formErrors[`connection-${index}-trader_reward`]}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Приоритет</Label>
                          <Select
                            value={connection.trader_priority}
                            onValueChange={(value) => handleTraderConnectionUpdate(index, "trader_priority", value)}
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
                            onChange={(e) => handleTraderConnectionUpdate(index, "merchant_deals_duration_minutes", e.target.value)}
                            placeholder="1440"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="activity" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Unlock className="h-4 w-4" />
                              <Label>Мерчант разблокирован</Label>
                            </div>
                            <Switch
                              checked={connection.activity_params.merchant_unlocked}
                              onCheckedChange={(checked) => handleTraderConnectionUpdate(index, "activity_params.merchant_unlocked", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Unlock className="h-4 w-4" />
                              <Label>Трейдер разблокирован</Label>
                            </div>
                            <Switch
                              checked={connection.activity_params.trader_unlocked}
                              onCheckedChange={(checked) => handleTraderConnectionUpdate(index, "activity_params.trader_unlocked", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <Label>Антифрод разблокирован</Label>
                            </div>
                            <Switch
                              checked={connection.activity_params.antifraud_unlocked}
                              onCheckedChange={(checked) => handleTraderConnectionUpdate(index, "activity_params.antifraud_unlocked", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              <Label>Ручная разблокировка</Label>
                            </div>
                            <Switch
                              checked={connection.activity_params.manually_unlocked}
                              onCheckedChange={(checked) => handleTraderConnectionUpdate(index, "activity_params.manually_unlocked", checked)}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="security" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <Label>Требуется антифрод</Label>
                          </div>
                          <Switch
                            checked={connection.antifraud_params.antifraud_required}
                            onCheckedChange={(checked) => handleTraderConnectionUpdate(index, "antifraud_params.antifraud_required", checked)}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </Card>
                );
              })
            )}
            
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => openAddConnectionModal(traderSettingsForm.trader_id)}
              disabled={actionLoading !== null}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить подключение
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTraderSettingsModal({open: false, trader: null})} disabled={actionLoading !== null}>
              Отмена
            </Button>
            <Button onClick={handleTraderSettingsSave} disabled={actionLoading === `trader-save-${traderSettingsForm.trader_id}`}>
              {actionLoading === `trader-save-${traderSettingsForm.trader_id}` ? (
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

      {/* Add Connection Modal */}
      <Dialog open={addConnectionModal.open} onOpenChange={(open) => setAddConnectionModal({open, trader_id: ""})}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Добавить подключение</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="security">Безопасность</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label>Мерчант</Label>
                <Select
                  value={newConnectionForm.merchant_id}
                  onValueChange={(value) => {
                    setNewConnectionForm({...newConnectionForm, merchant_id: value});
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
                    {getAvailableMerchants(addConnectionModal.trader_id).map(merchant => (
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
                    value={newConnectionForm.name}
                    onChange={(e) => setNewConnectionForm({...newConnectionForm, name: e.target.value})}
                    placeholder="Название подключения"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Награда трейдера (%)</Label>
                  <Input
                    type="text"
                    value={newConnectionForm.trader_reward}
                    onChange={(e) => {
                      const validated = validatePercentageInput(e.target.value);
                      setNewConnectionForm({...newConnectionForm, trader_reward: validated});
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
                  value={newConnectionForm.trader_priority}
                  onValueChange={(value) => setNewConnectionForm({...newConnectionForm, trader_priority: value})}
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
                  value={newConnectionForm.merchant_deals_duration_minutes}
                  onChange={(e) => setNewConnectionForm({...newConnectionForm, merchant_deals_duration_minutes: e.target.value})}
                  placeholder="1440"
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  <Label>Мерчант разблокирован</Label>
                </div>
                <Switch
                  checked={newConnectionForm.activity_params.merchant_unlocked}
                  onCheckedChange={(checked) => setNewConnectionForm({
                    ...newConnectionForm,
                    activity_params: {...newConnectionForm.activity_params, merchant_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  <Label>Трейдер разблокирован</Label>
                </div>
                <Switch
                  checked={newConnectionForm.activity_params.trader_unlocked}
                  onCheckedChange={(checked) => setNewConnectionForm({
                    ...newConnectionForm,
                    activity_params: {...newConnectionForm.activity_params, trader_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Антифрод разблокирован</Label>
                </div>
                <Switch
                  checked={newConnectionForm.activity_params.antifraud_unlocked}
                  onCheckedChange={(checked) => setNewConnectionForm({
                    ...newConnectionForm,
                    activity_params: {...newConnectionForm.activity_params, antifraud_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <Label>Ручная разблокировка</Label>
                </div>
                <Switch
                  checked={newConnectionForm.activity_params.manually_unlocked}
                  onCheckedChange={(checked) => setNewConnectionForm({
                    ...newConnectionForm,
                    activity_params: {...newConnectionForm.activity_params, manually_unlocked: checked}
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Требуется антифрод</Label>
                </div>
                <Switch
                  checked={newConnectionForm.antifraud_params.antifraud_required}
                  onCheckedChange={(checked) => setNewConnectionForm({
                    ...newConnectionForm,
                    antifraud_params: {...newConnectionForm.antifraud_params, antifraud_required: checked}
                  })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddConnectionModal({open: false, trader_id: ""})} disabled={actionLoading !== null}>
              Отмена
            </Button>
            <Button onClick={handleAddConnection} disabled={actionLoading === `add-connection-${addConnectionModal.trader_id}`}>
              {actionLoading === `add-connection-${addConnectionModal.trader_id}` ? (
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

      {/* Single Connection Modal */}
      <Dialog open={singleConnectionModal.open} onOpenChange={(open) => setSingleConnectionModal({open, connection: null})}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Редактировать подключение</DialogTitle>
          </DialogHeader>
          {singleConnectionModal.connection && (
            <div className="mt-2 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Мерчант</p>
                  {renderUserInfo(merchants.find(m => m.id === singleConnectionModal.connection!.merchant_id)!)}
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Трейдер</p>
                  {renderUserInfo(traders.find(t => t.id === singleConnectionModal.connection!.trader_id)!)}
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="security">Безопасность</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={singleConnectionForm.name}
                    onChange={(e) => setSingleConnectionForm({...singleConnectionForm, name: e.target.value})}
                    placeholder="Название подключения"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Награда трейдера (%)</Label>
                  <Input
                    type="text"
                    value={singleConnectionForm.trader_reward}
                    onChange={(e) => {
                      const validated = validatePercentageInput(e.target.value);
                      setSingleConnectionForm({...singleConnectionForm, trader_reward: validated});
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
                  value={singleConnectionForm.trader_priority}
                  onValueChange={(value) => setSingleConnectionForm({...singleConnectionForm, trader_priority: value})}
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
                  value={singleConnectionForm.merchant_deals_duration_minutes}
                  onChange={(e) => setSingleConnectionForm({...singleConnectionForm, merchant_deals_duration_minutes: e.target.value})}
                  placeholder="1440"
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  <Label>Мерчант разблокирован</Label>
                </div>
                <Switch
                  checked={singleConnectionForm.activity_params.merchant_unlocked}
                  onCheckedChange={(checked) => setSingleConnectionForm({
                    ...singleConnectionForm,
                    activity_params: {...singleConnectionForm.activity_params, merchant_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  <Label>Трейдер разблокирован</Label>
                </div>
                <Switch
                  checked={singleConnectionForm.activity_params.trader_unlocked}
                  onCheckedChange={(checked) => setSingleConnectionForm({
                    ...singleConnectionForm,
                    activity_params: {...singleConnectionForm.activity_params, trader_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Антифрод разблокирован</Label>
                </div>
                <Switch
                  checked={singleConnectionForm.activity_params.antifraud_unlocked}
                  onCheckedChange={(checked) => setSingleConnectionForm({
                    ...singleConnectionForm,
                    activity_params: {...singleConnectionForm.activity_params, antifraud_unlocked: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <Label>Ручная разблокировка</Label>
                </div>
                <Switch
                  checked={singleConnectionForm.activity_params.manually_unlocked}
                  onCheckedChange={(checked) => setSingleConnectionForm({
                    ...singleConnectionForm,
                    activity_params: {...singleConnectionForm.activity_params, manually_unlocked: checked}
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Требуется антифрод</Label>
                </div>
                <Switch
                  checked={singleConnectionForm.antifraud_params.antifraud_required}
                  onCheckedChange={(checked) => setSingleConnectionForm({
                    ...singleConnectionForm,
                    antifraud_params: {...singleConnectionForm.antifraud_params, antifraud_required: checked}
                  })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleConnectionModal({open: false, connection: null})} disabled={actionLoading !== null}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSingleConnectionModal({open: false, connection: null});
                if (singleConnectionModal.connection) {
                  setDeleteConnectionDialog({open: true, connection: singleConnectionModal.connection});
                }
              }}
              disabled={actionLoading !== null}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
            <Button onClick={handleSingleConnectionSave} disabled={actionLoading === `single-connection-save-${singleConnectionForm.connection_id}`}>
              {actionLoading === `single-connection-save-${singleConnectionForm.connection_id}` ? (
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

      {/* Delete Dialogs */}
      <AlertDialog open={deleteMerchantDialog.open} onOpenChange={(open) => setDeleteMerchantDialog({open, merchant: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит все записи трафика для мерчанта {deleteMerchantDialog.merchant?.merchant.username}. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMerchant}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `merchant-delete-${deleteMerchantDialog.merchant?.merchant.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTraderDialog.open} onOpenChange={(open) => setDeleteTraderDialog({open, trader: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит все записи трафика для трейдера {deleteTraderDialog.trader?.trader.username}. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrader}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `trader-delete-${deleteTraderDialog.trader?.trader.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConnectionDialog.open} onOpenChange={(open) => setDeleteConnectionDialog({open, connection: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить подключение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит запись трафика. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConnection}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `connection-delete-${deleteConnectionDialog.connection?.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
            
      {/* Manual Unlock Modal */}
<Dialog open={unlockModal.open} onOpenChange={(open) => {
  if (!open) {
    setUnlockModal({open: false, trader_id: "", trader_name: ""});
    setUnlockForm({reason: "", grace_period_minutes: 30, admin_id: ""});
  } else {
    setUnlockModal(prev => ({...prev, open}));
  }
}}>
  <DialogContent className="sm:max-w-[550px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Unlock className="h-5 w-5" />
        Ручная разблокировка трейдера
      </DialogTitle>
    </DialogHeader>
    
    {unlockModal.trader_id && (
      <div className="space-y-4 py-4">
        {/* Информация о трейдере */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-900">{unlockModal.trader_name}</p>
              <p className="text-sm text-orange-700 mt-1">
                <span className="font-mono">{unlockModal.trader_id}</span>
              </p>
            </div>
          </div>
        </div>
    
        {/* Предупреждение */}
        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Внимание!</p>
            <p>
              После разблокировки трейдер не будет проверяться антифродом в течение грейс-периода. 
              Убедитесь, что причина разблокировки обоснована.
            </p>
          </div>
        </div>
        
        {/* Форма */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="text-red-500">*</span>
              Причина разблокировки
            </Label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={unlockForm.reason}
              onChange={(e) => setUnlockForm({...unlockForm, reason: e.target.value})}
              placeholder="Например: Подтверждено, что отмены были по техническим причинам..."
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Обязательное поле. Будет сохранено в логах.
              </p>
              <p className="text-xs text-muted-foreground">
                {unlockForm.reason.length}/500
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
              Грейс-период (минуты)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={10080}
                value={unlockForm.grace_period_minutes}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 30;
                  setUnlockForm({...unlockForm, grace_period_minutes: Math.min(Math.max(value, 1), 10080)});
                }}
                className="flex-1"
              />
              <Select
                value={unlockForm.grace_period_minutes.toString()}
                onValueChange={(value) => setUnlockForm({...unlockForm, grace_period_minutes: parseInt(value)})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 минут</SelectItem>
                  <SelectItem value="60">1 час</SelectItem>
                  <SelectItem value="120">2 часа</SelectItem>
                  <SelectItem value="360">6 часов</SelectItem>
                  <SelectItem value="720">12 часов</SelectItem>
                  <SelectItem value="1440">1 день</SelectItem>
                  <SelectItem value="2880">2 дня</SelectItem>
                  <SelectItem value="10080">1 неделя</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              В течение этого времени трейдер не будет проверяться антифродом. 
              После окончания проверки возобновятся автоматически.
            </p>
          </div>
              
          {/* Предпросмотр */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Предпросмотр:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                • Трейдер будет разблокирован немедленно
              </p>
              <p>
                • Грейс-период: <span className="font-medium text-foreground">
                  {unlockForm.grace_period_minutes} минут 
                  ({Math.floor(unlockForm.grace_period_minutes / 60)}ч {unlockForm.grace_period_minutes % 60}м)
                </span>
              </p>
              <p>
                • Грейс-период до: <span className="font-medium text-foreground">
                  {new Date(Date.now() + unlockForm.grace_period_minutes * 60000).toLocaleString('ru-RU')}
                </span>
              </p>
              <p>
                • Причина будет записана в аудит-лог
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
    
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => {
          setUnlockModal({open: false, trader_id: "", trader_name: ""});
          setUnlockForm({reason: "", grace_period_minutes: 30, admin_id: ""});
        }}
        disabled={actionLoading !== null}
      >
        Отмена
      </Button>
      <Button
        onClick={handleManualUnlock}
        disabled={actionLoading === `unlock-${unlockModal.trader_id}` || !unlockForm.reason.trim()}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {actionLoading === `unlock-${unlockModal.trader_id}` ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Разблокировка...
          </>
        ) : (
          <>
            <Unlock className="mr-2 h-4 w-4" />
            Разблокировать
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      
    </div>
  );
}