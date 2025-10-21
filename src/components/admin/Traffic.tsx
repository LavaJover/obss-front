import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Loader2, Copy, CheckCheck, Settings, Plus, Trash2, Users, User, ChevronsUpDown, Search, Lock, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface TrafficRecord {
  id: string;
  merchant_id: string;
  trader_id: string;
  trader_reward: number;
  trader_priority: number;
  platform_fee: number;
  enabled: boolean;
  name: string;
  traffic_activity_params: {
    merchant_unlocked: boolean;
    trader_unlocked: boolean;
    antifraud_unlocked: boolean;
    manually_unlocked: boolean;
  };
  traffic_antifraud_params: {
    antifraud_required: boolean;
  };
  traffic_business_params: {
    merchant_deals_duration: string;
  };
}

interface MerchantTraffic {
  merchant: User;
  platform_fee: number;
  enabled: boolean;
  connections_count: number;
  connected_traders: User[];
  merchant_unlocked: boolean;
}

interface TraderTraffic {
  trader: User;
  enabled: boolean;
  connections: TrafficRecord[];
  manually_unlocked: boolean;
  lock_statuses: {
    merchant_unlocked: boolean;
    trader_unlocked: boolean;
    antifraud_unlocked: boolean;
    manually_unlocked: boolean;
  };
}

interface MerchantSettingsForm {
  merchant_id: string;
  platform_fee: string;
  enabled: boolean;
}

interface TraderConnectionForm {
  merchant_id: string;
  trader_reward: string;
  trader_priority: string;
  enabled: boolean;
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
  enabled: boolean;
}

interface CreateTrafficForm {
  merchant_id: string;
  trader_id: string;
  trader_reward: string;
  trader_priority: string;
  platform_fee: string;
  enabled: boolean;
  name: string;
  traffic_activity_params: {
    merchant_unlocked: boolean;
    trader_unlocked: boolean;
    antifraud_unlocked: boolean;
    manually_unlocked: boolean;
  };
  traffic_antifraud_params: {
    antifraud_required: boolean;
  };
  traffic_business_params: {
    merchant_deals_duration: number;
  };
}

const PRIORITY_OPTIONS = [
  { label: "Обычный", value: "1" },
  { label: "Средний", value: "5" },
  { label: "Высокий", value: "15" },
  { label: "Превосходство", value: "1000" }
];

// Функция для преобразования времени в наносекунды (для Go time.Duration)
const convertHoursToNanoseconds = (hours: number): number => {
  return hours * 60 * 60 * 1e9; // часы -> минуты -> секунды -> наносекунды
};

// Функция для валидации ввода процентов
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

export default function TrafficTab() {
  const [merchants, setMerchants] = useState<User[]>([]);
  const [traders, setTraders] = useState<User[]>([]);
  const [trafficRecords, setTrafficRecords] = useState<TrafficRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  // Modal states
  const [merchantSettingsModal, setMerchantSettingsModal] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [traderSettingsModal, setTraderSettingsModal] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [addConnectionModal, setAddConnectionModal] = useState<{open: boolean; trader_id: string}>({open: false, trader_id: ""});
  const [singleConnectionModal, setSingleConnectionModal] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});
  
  // Confirmation dialogs
  const [deleteMerchantDialog, setDeleteMerchantDialog] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [deleteTraderDialog, setDeleteTraderDialog] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [deleteConnectionDialog, setDeleteConnectionDialog] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});

  // Form states
  const [merchantSettingsForm, setMerchantSettingsForm] = useState<MerchantSettingsForm>({
    merchant_id: "",
    platform_fee: "",
    enabled: true
  });

  const [traderSettingsForm, setTraderSettingsForm] = useState<TraderSettingsForm>({
    trader_id: "",
    connections: []
  });

  const [newConnectionForm, setNewConnectionForm] = useState<CreateTrafficForm>({
    merchant_id: "",
    trader_id: "",
    trader_reward: "",
    trader_priority: "1",
    platform_fee: "",
    enabled: true,
    name: "",
    traffic_activity_params: {
      merchant_unlocked: true,
      trader_unlocked: true,
      antifraud_unlocked: true,
      manually_unlocked: true
    },
    traffic_antifraud_params: {
      antifraud_required: false
    },
    traffic_business_params: {
      merchant_deals_duration: convertHoursToNanoseconds(24) // 24 часа по умолчанию в наносекундах
    }
  });

  const [singleConnectionForm, setSingleConnectionForm] = useState<SingleConnectionForm>({
    connection_id: "",
    merchant_id: "",
    trader_id: "",
    trader_reward: "",
    trader_priority: "1",
    enabled: true
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [traderSearchOpen, setTraderSearchOpen] = useState<{[key: string]: boolean}>({});

  // Добавляем интерцепторы для отладки
  useEffect(() => {
    // Интерцептор запросов
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        console.log('🔄 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          params: config.params
        });
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Интерцептор ответов
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting data fetch...');
      
      const [merchantRes, traderRes, teamLeadRes, trafficRes] = await Promise.all([
        apiClient.get("/admin/users?role=MERCHANT"),
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD"),
        apiClient.get("/admin/traffic/records?page=1&limit=100")
      ]);
      
      console.log('📊 Fetch results:', {
        merchants: merchantRes.data.users?.length || 0,
        traders: traderRes.data.users?.length || 0,
        teamLeads: teamLeadRes.data.users?.length || 0,
        trafficRecords: trafficRes.data.traffic_records?.length || 0
      });
      
      const allTraders = [
        ...(traderRes.data.users || []),
        ...(teamLeadRes.data.users || [])
      ];
      
      setMerchants(merchantRes.data.users || []);
      setTraders(allTraders);
      setTrafficRecords(trafficRes.data.traffic_records || []);
      
      console.log('✅ Data fetch completed successfully');
    } catch (err: any) {
      console.error("❌ Ошибка при загрузке данных:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные трафика",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aggregate data for merchants
  const merchantTraffic: MerchantTraffic[] = merchants.map(merchant => {
    const merchantRecords = trafficRecords.filter(record => record.merchant_id === merchant.id);
    const platformFee = merchantRecords.length > 0 ? merchantRecords[0].platform_fee : 0;
    const enabled = merchantRecords.some(record => record.enabled);
    const connections_count = merchantRecords.length;
    const merchant_unlocked = merchantRecords.some(record => record.traffic_activity_params.merchant_unlocked);
    
    const connectedTraders = merchantRecords.map(record => {
      const trader = traders.find(t => t.id === record.trader_id);
      return trader!;
    }).filter(trader => trader !== undefined);

    return {
      merchant,
      platform_fee: platformFee,
      enabled,
      connections_count,
      connected_traders: connectedTraders,
      merchant_unlocked
    };
  });

  // Aggregate data for traders
  const traderTraffic: TraderTraffic[] = traders.map(trader => {
    const connections = trafficRecords.filter(record => record.trader_id === trader.id);
    const enabled = connections.some(connection => connection.enabled);
    const manually_unlocked = connections.some(connection => connection.traffic_activity_params.manually_unlocked);

    const lock_statuses = {
      merchant_unlocked: connections.some(connection => connection.traffic_activity_params.merchant_unlocked),
      trader_unlocked: connections.some(connection => connection.traffic_activity_params.trader_unlocked),
      antifraud_unlocked: connections.some(connection => connection.traffic_activity_params.antifraud_unlocked),
      manually_unlocked: connections.some(connection => connection.traffic_activity_params.manually_unlocked)
    };

    return {
      trader,
      enabled,
      connections,
      manually_unlocked,
      lock_statuses
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

  // Компонент для отображения статусов блокировок
  const LockStatusBadge = ({ unlocked, tooltip }: { unlocked: boolean; tooltip: string }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge 
              variant={unlocked ? "default" : "secondary"} 
              className={cn(
                "cursor-help",
                unlocked ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              )}
            >
              {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Merchant actions - обновлено для merchant_unlocked
  const handleMerchantToggle = async (merchantTraffic: MerchantTraffic) => {
    const newUnlockedStatus = !merchantTraffic.merchant_unlocked;
    console.log('🔄 Toggling merchant lock:', {
      merchantId: merchantTraffic.merchant.id,
      merchantName: merchantTraffic.merchant.username,
      currentUnlocked: merchantTraffic.merchant_unlocked,
      newUnlocked: newUnlockedStatus
    });

    setActionLoading(`merchant-toggle-${merchantTraffic.merchant.id}`);
    try {
      const url = `/traffic/merchants/${merchantTraffic.merchant.id}?unlocked=${newUnlockedStatus}`;
      console.log('📤 Sending merchant toggle request to:', url);
      
      const response = await apiClient.patch(url);
      
      console.log('✅ Merchant toggle response:', response.data);
      
      toast({
        title: "Статус обновлён",
        description: `Блокировка мерчанта ${merchantTraffic.merchant.username} ${newUnlockedStatus ? 'снята' : 'установлена'}`,
      });
      
      // Даем время серверу обработать запрос перед обновлением данных
      setTimeout(() => {
        fetchData();
      }, 300);
    } catch (err: any) {
      console.error("❌ Ошибка при обновлении блокировки мерчанта:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось обновить блокировку мерчанта",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openMerchantSettings = (merchantTraffic: MerchantTraffic) => {
    console.log('📝 Opening merchant settings:', merchantTraffic.merchant.username);
    setMerchantSettingsForm({
      merchant_id: merchantTraffic.merchant.id,
      platform_fee: formatDecimal(merchantTraffic.platform_fee),
      enabled: merchantTraffic.enabled
    });
    setMerchantSettingsModal({ open: true, merchant: merchantTraffic });
    setFormErrors({});
  };

  const handleMerchantSettingsSave = async () => {
    const platformFeeValue = parseFloat(merchantSettingsForm.platform_fee);
    if (isNaN(platformFeeValue) || platformFeeValue < 0) {
      setFormErrors({ platform_fee: "Введите корректную комиссию" });
      return;
    }

    console.log('💾 Saving merchant settings:', {
      merchant_id: merchantSettingsForm.merchant_id,
      platform_fee: platformFeeValue / 100,
      enabled: merchantSettingsForm.enabled
    });

    setActionLoading(`merchant-save-${merchantSettingsForm.merchant_id}`);
    try {
      // Обновляем все записи трафика для этого мерчанта
      const merchantRecords = trafficRecords.filter(record => record.merchant_id === merchantSettingsForm.merchant_id);
      console.log(`📊 Found ${merchantRecords.length} records to update`);

      const updatePromises = merchantRecords.map(record => {
        const updateData = {
          id: record.id,
          platform_fee: platformFeeValue / 100,
          enabled: merchantSettingsForm.enabled
        };
        console.log('📤 Updating record:', updateData);
        return apiClient.patch("/admin/traffic/edit", updateData);
      });

      const results = await Promise.all(updatePromises);
      console.log('✅ Merchant settings save results:', results);

      toast({
        title: "Настройки сохранены",
        description: "Настройки мерчанта успешно обновлены",
      });

      setMerchantSettingsModal({ open: false, merchant: null });
      
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при сохранении настроек мерчанта:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!deleteMerchantDialog.merchant) return;

    console.log('🗑️ Deleting merchant:', deleteMerchantDialog.merchant.merchant.username);

    setActionLoading(`merchant-delete-${deleteMerchantDialog.merchant.merchant.id}`);
    try {
      const deletePromises = trafficRecords
        .filter(record => record.merchant_id === deleteMerchantDialog.merchant!.merchant.id)
        .map(record => {
          console.log('🗑️ Deleting traffic record:', record.id);
          return apiClient.delete(`/admin/traffic/${record.id}`);
        });

      const results = await Promise.all(deletePromises);
      console.log('✅ Merchant delete results:', results);

      toast({
        title: "Мерчант удалён",
        description: `Все записи трафика для ${deleteMerchantDialog.merchant.merchant.username} удалены`,
      });

      setDeleteMerchantDialog({ open: false, merchant: null });
      
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при удалении мерчанта:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось удалить записи трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Trader actions - обновлено для manually_unlocked
  const handleTraderToggle = async (traderTraffic: TraderTraffic) => {
    const newUnlockedStatus = !traderTraffic.manually_unlocked;
    console.log('🔄 Toggling trader manual lock:', {
      traderId: traderTraffic.trader.id,
      traderName: traderTraffic.trader.username,
      currentUnlocked: traderTraffic.manually_unlocked,
      newUnlocked: newUnlockedStatus,
      connectionsCount: traderTraffic.connections.length
    });

    setActionLoading(`trader-toggle-${traderTraffic.trader.id}`);
    try {
      // Для каждого подключения трейдера устанавливаем manually_unlocked
      const updatePromises = traderTraffic.connections.map(connection => {
        const url = `/traffic/${connection.id}/manual?unlocked=${newUnlockedStatus}`;
        console.log('📤 Sending manual lock update:', { connectionId: connection.id, url });
        return apiClient.patch(url);
      });

      const results = await Promise.all(updatePromises);
      console.log('✅ Trader toggle results:', results);

      toast({
        title: "Статус обновлён",
        description: `Ручная блокировка для трейдера ${traderTraffic.trader.username} ${newUnlockedStatus ? 'снята' : 'установлена'}`,
      });

      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при обновлении ручной блокировки трейдера:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка обновления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось обновить блокировку",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openTraderSettings = (traderTraffic: TraderTraffic) => {
    console.log('📝 Opening trader settings:', traderTraffic.trader.username);
    const connectionsForm: TraderConnectionForm[] = traderTraffic.connections.map(connection => ({
      merchant_id: connection.merchant_id,
      trader_reward: formatDecimal(connection.trader_reward),
      trader_priority: connection.trader_priority.toString(),
      enabled: connection.enabled
    }));

    setTraderSettingsForm({
      trader_id: traderTraffic.trader.id,
      connections: connectionsForm
    });
    setTraderSettingsModal({ open: true, trader: traderTraffic });
    setFormErrors({});
  };

  const handleTraderConnectionUpdate = (index: number, field: string, value: string | boolean) => {
    const updatedConnections = [...traderSettingsForm.connections];
    updatedConnections[index] = {
      ...updatedConnections[index],
      [field]: value
    };

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
    console.log('💾 Saving trader settings:', {
      trader_id: traderSettingsForm.trader_id,
      connectionsCount: traderSettingsForm.connections.length
    });

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
      console.log('❌ Validation errors:', errors);
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

        if (!originalRecord) {
          console.warn('⚠️ Original record not found for connection:', connection);
          return Promise.resolve();
        }

        const updateData = {
          id: originalRecord.id,
          trader_reward: parseFloat(connection.trader_reward) / 100,
          trader_priority: parseInt(connection.trader_priority),
          enabled: connection.enabled
        };

        console.log('📤 Updating trader connection:', updateData);
        return apiClient.patch("/admin/traffic/edit", updateData);
      });

      const results = await Promise.all(updatePromises);
      console.log('✅ Trader settings save results:', results);

      toast({
        title: "Настройки сохранены",
        description: "Настройки трейдера успешно обновлены",
      });

      await fetchData();
      const updatedTrader = traderTraffic.find(t => t.trader.id === traderSettingsForm.trader_id);
      if (updatedTrader) {
        openTraderSettings(updatedTrader);
      }
    } catch (err: any) {
      console.error("❌ Ошибка при сохранении настроек трейдера:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openAddConnectionModal = (trader_id: string) => {
    console.log('➕ Opening add connection modal for trader:', trader_id);
    const defaultPlatformFee = "1.000"; // 1% по умолчанию
    
    setNewConnectionForm({
      merchant_id: "",
      trader_id: trader_id,
      trader_reward: "",
      trader_priority: "1",
      platform_fee: defaultPlatformFee,
      enabled: true,
      name: "",
      traffic_activity_params: {
        merchant_unlocked: true,
        trader_unlocked: true,
        antifraud_unlocked: true,
        manually_unlocked: true
      },
      traffic_antifraud_params: {
        antifraud_required: false
      },
      traffic_business_params: {
        merchant_deals_duration: convertHoursToNanoseconds(24) // 24 часа по умолчанию в наносекундах
      }
    });
    setAddConnectionModal({ open: true, trader_id });
    setFormErrors({});
  };

  const handleAddConnection = async () => {
    const reward = parseFloat(newConnectionForm.trader_reward);
    const platformFee = parseFloat(newConnectionForm.platform_fee);
    const errors: {[key: string]: string} = {};

    console.log('➕ Creating new connection:', {
      merchant_id: newConnectionForm.merchant_id,
      trader_id: newConnectionForm.trader_id,
      reward,
      platformFee
    });

    if (!newConnectionForm.merchant_id) {
      errors.merchant_id = "Выберите мерчанта";
    }

    if (isNaN(reward) || reward < 0) {
      errors.trader_reward = "Введите корректную награду";
    }

    if (isNaN(platformFee) || platformFee < 0) {
      errors.platform_fee = "Введите корректную комиссию платформы";
    }

    const existingConnection = trafficRecords.find(record => 
      record.merchant_id === newConnectionForm.merchant_id && 
      record.trader_id === newConnectionForm.trader_id
    );

    if (existingConnection) {
      errors.merchant_id = "Этот мерчант уже подключен к данному трейдеру";
    }

    if (reward > platformFee) {
      errors.trader_reward = "Награда трейдера не может превышать комиссию платформы";
    }

    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation errors:', errors);
      setFormErrors(errors);
      return;
    }

    setActionLoading(`add-connection-${newConnectionForm.trader_id}`);
    try {
      const createData = {
        merchant_id: newConnectionForm.merchant_id,
        trader_id: newConnectionForm.trader_id,
        trader_reward: reward / 100,
        trader_priority: parseInt(newConnectionForm.trader_priority),
        platform_fee: platformFee / 100,
        enabled: newConnectionForm.enabled,
        name: newConnectionForm.name || `${merchants.find(m => m.id === newConnectionForm.merchant_id)?.username} - ${traders.find(t => t.id === newConnectionForm.trader_id)?.username}`,
        traffic_activity_params: newConnectionForm.traffic_activity_params,
        traffic_antifraud_params: newConnectionForm.traffic_antifraud_params,
        traffic_business_params: {
          merchant_deals_duration: newConnectionForm.traffic_business_params.merchant_deals_duration
        }
      };

      console.log('📤 Creating new connection:', createData);
      const response = await apiClient.post("/admin/traffic/create", createData);
      console.log('✅ Connection created response:', response.data);

      toast({
        title: "Подключение создано",
        description: "Новое подключение успешно создано",
      });

      await fetchData();
      const updatedTrader = traderTraffic.find(t => t.trader.id === newConnectionForm.trader_id);
      if (updatedTrader) {
        openTraderSettings(updatedTrader);
      }
      setAddConnectionModal({ open: false, trader_id: "" });
    } catch (err: any) {
      console.error("❌ Ошибка при создании подключения:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка создания",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось создать подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTrader = async () => {
    if (!deleteTraderDialog.trader) return;

    console.log('🗑️ Deleting trader:', deleteTraderDialog.trader.trader.username);

    setActionLoading(`trader-delete-${deleteTraderDialog.trader.trader.id}`);
    try {
      const deletePromises = deleteTraderDialog.trader.connections.map(connection => {
        console.log('🗑️ Deleting trader connection:', connection.id);
        return apiClient.delete(`/admin/traffic/${connection.id}`);
      });

      const results = await Promise.all(deletePromises);
      console.log('✅ Trader delete results:', results);

      toast({
        title: "Трейдер удалён",
        description: `Все записи трафика для ${deleteTraderDialog.trader.trader.username} удалены`,
      });

      setDeleteTraderDialog({ open: false, trader: null });
      
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при удалении трейдера:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось удалить записи трафика",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnectionInTraderModal = async (connectionIndex: number) => {
    const connection = traderSettingsModal.trader?.connections[connectionIndex];
    if (!connection) return;

    console.log('🗑️ Deleting connection in modal:', connection.id);

    setActionLoading(`connection-delete-${connection.id}`);
    try {
      await apiClient.delete(`/admin/traffic/${connection.id}`);
      
      console.log('✅ Connection deleted successfully');
      
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
      console.error("❌ Ошибка при удалении подключения:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось удалить подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnection = async () => {
    if (!deleteConnectionDialog.connection) return;

    console.log('🗑️ Deleting single connection:', deleteConnectionDialog.connection.id);

    setActionLoading(`connection-delete-${deleteConnectionDialog.connection.id}`);
    try {
      await apiClient.delete(`/admin/traffic/${deleteConnectionDialog.connection.id}`);
      
      console.log('✅ Connection deleted successfully');
      
      toast({
        title: "Подключение удалено",
        description: "Подключение успешно удалено",
      });
      
      setDeleteConnectionDialog({ open: false, connection: null });
      
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при удалении подключения:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка удаления",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось удалить подключение",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Single connection modal functions
  const openSingleConnectionModal = (connection: TrafficRecord) => {
    const merchant = merchants.find(m => m.id === connection.merchant_id);
    const trader = traders.find(t => t.id === connection.trader_id);
    
    if (!merchant || !trader) return;

    console.log('📝 Opening single connection modal:', {
      connectionId: connection.id,
      merchant: merchant.username,
      trader: trader.username
    });

    setSingleConnectionForm({
      connection_id: connection.id,
      merchant_id: connection.merchant_id,
      trader_id: connection.trader_id,
      trader_reward: formatDecimal(connection.trader_reward),
      trader_priority: connection.trader_priority.toString(),
      enabled: connection.enabled
    });
    
    setSingleConnectionModal({ open: true, connection });
    setFormErrors({});
  };

  const handleSingleConnectionSave = async () => {
    const reward = parseFloat(singleConnectionForm.trader_reward);
    const priority = parseInt(singleConnectionForm.trader_priority);
    const errors: {[key: string]: string} = {};

    console.log('💾 Saving single connection:', {
      connectionId: singleConnectionForm.connection_id,
      reward,
      priority,
      enabled: singleConnectionForm.enabled
    });

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
      console.log('❌ Validation errors:', errors);
      setFormErrors(errors);
      return;
    }

    setActionLoading(`single-connection-save-${singleConnectionForm.connection_id}`);
    try {
      const updateData = {
        id: singleConnectionForm.connection_id,
        trader_reward: reward / 100,
        trader_priority: priority,
        enabled: singleConnectionForm.enabled
      };

      console.log('📤 Updating single connection:', updateData);
      const response = await apiClient.patch("/admin/traffic/edit", updateData);
      console.log('✅ Single connection update response:', response.data);

      toast({
        title: "Настройки сохранены",
        description: "Настройки подключения успешно обновлены",
      });

      setSingleConnectionModal({ open: false, connection: null });
      
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: any) {
      console.error("❌ Ошибка при сохранении настроек подключения:", err);
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.error || err.response?.data?.message || "Не удалось сохранить настройки",
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
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

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
                  <TableHead>Блокировка</TableHead>
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
                                          Награда: {connection ? formatDecimal(connection.trader_reward) : '0.000'}%, 
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
                      <div className="flex items-center gap-2">
                        <Badge variant={merchant.merchant_unlocked ? "default" : "secondary"}>
                          {merchant.merchant_unlocked ? "Разблокирован" : "Заблокирован"}
                        </Badge>
                        <Switch
                          checked={merchant.merchant_unlocked}
                          onCheckedChange={() => handleMerchantToggle(merchant)}
                          disabled={actionLoading === `merchant-toggle-${merchant.merchant.id}`}
                        />
                        {actionLoading === `merchant-toggle-${merchant.merchant.id}` && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                  <TableHead>Ручная блокировка</TableHead>
                  <TableHead>Статусы блокировок</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traderTraffic.map((trader) => (
                  <TableRow key={trader.trader.id}>
                    <TableCell>{renderUserInfo(trader.trader)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={trader.manually_unlocked ? "default" : "secondary"}>
                          {trader.manually_unlocked ? "Разблокирован" : "Заблокирован"}
                        </Badge>
                        <Switch
                          checked={trader.manually_unlocked}
                          onCheckedChange={() => handleTraderToggle(trader)}
                          disabled={actionLoading === `trader-toggle-${trader.trader.id}`}
                        />
                        {actionLoading === `trader-toggle-${trader.trader.id}` && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <LockStatusBadge 
                            unlocked={trader.lock_statuses.merchant_unlocked}
                            tooltip="Блокировка мерчанта"
                          />
                          <LockStatusBadge 
                            unlocked={trader.lock_statuses.trader_unlocked}
                            tooltip="Блокировка трейдера"
                          />
                          <LockStatusBadge 
                            unlocked={trader.lock_statuses.antifraud_unlocked}
                            tooltip="Блокировка антифрода"
                          />
                          <LockStatusBadge 
                            unlocked={trader.lock_statuses.manually_unlocked}
                            tooltip="Ручная блокировка"
                          />
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Остальные модальные окна остаются без изменений */}
      {/* Merchant Settings Modal */}
      <Dialog open={merchantSettingsModal.open} onOpenChange={(open) => setMerchantSettingsModal({ open, merchant: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки мерчанта</DialogTitle>
            <DialogDescription>
              Настройки для {merchantSettingsModal.merchant?.merchant.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform_fee">Комиссия платформы (%)</Label>
              <Input
                id="platform_fee"
                type="text"
                placeholder="9.500"
                value={merchantSettingsForm.platform_fee}
                onChange={(e) => setMerchantSettingsForm({
                  ...merchantSettingsForm, 
                  platform_fee: validatePercentageInput(e.target.value)
                })}
                className={formErrors.platform_fee ? "border-red-500" : ""}
              />
              {formErrors.platform_fee && (
                <div className="text-red-500 text-xs">{formErrors.platform_fee}</div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="merchant-enabled"
                checked={merchantSettingsForm.enabled}
                onCheckedChange={(enabled) => setMerchantSettingsForm({...merchantSettingsForm, enabled})}
              />
              <Label htmlFor="merchant-enabled">Трафик включен</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMerchantSettingsModal({ open: false, merchant: null })}
            >
              Отмена
            </Button>
            <Button
              onClick={handleMerchantSettingsSave}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trader Settings Modal */}
      <Dialog open={traderSettingsModal.open} onOpenChange={(open) => setTraderSettingsModal({ open, trader: null })}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Настройки трейдера</DialogTitle>
            <DialogDescription>
              Управление подключениями для {traderSettingsModal.trader?.trader.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Подключенные мерчанты</h4>
              <Button
                size="sm"
                onClick={() => openAddConnectionModal(traderSettingsForm.trader_id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить мерчанта
              </Button>
            </div>
            
            {traderSettingsForm.connections.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Нет подключенных мерчантов
              </div>
            ) : (
              <div className="space-y-4">
                {traderSettingsForm.connections.map((connection, index) => {
                  const merchant = merchants.find(m => m.id === connection.merchant_id);
                  const platformFee = trafficRecords.find(record => 
                    record.merchant_id === connection.merchant_id && 
                    record.trader_id === traderSettingsForm.trader_id
                  )?.platform_fee || 0;

                  return (
                    <div key={connection.merchant_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{merchant?.username}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConnectionInTraderModal(index)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `connection-delete-${traderSettingsModal.trader?.connections[index]?.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`reward-${index}`}>Награда трейдера (%)</Label>
                          <Input
                            id={`reward-${index}`}
                            type="text"
                            placeholder="8.000"
                            value={connection.trader_reward}
                            onChange={(e) => handleTraderConnectionUpdate(index, "trader_reward", validatePercentageInput(e.target.value))}
                            className={formErrors[`connection-${index}-trader_reward`] ? "border-red-500" : ""}
                          />
                          {formErrors[`connection-${index}-trader_reward`] && (
                            <div className="text-red-500 text-xs">{formErrors[`connection-${index}-trader_reward`]}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Максимум: {formatDecimal(platformFee)}%
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`priority-${index}`}>Приоритет трейдера</Label>
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
                          <Label>Статус</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              checked={connection.enabled}
                              onCheckedChange={(enabled) => handleTraderConnectionUpdate(index, "enabled", enabled)}
                            />
                            <Label>{connection.enabled ? "Активен" : "Неактивен"}</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTraderSettingsModal({ open: false, trader: null })}
            >
              Отмена
            </Button>
            <Button
              onClick={handleTraderSettingsSave}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Connection Modal */}
      <Dialog open={singleConnectionModal.open} onOpenChange={(open) => setSingleConnectionModal({ open, connection: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки подключения</DialogTitle>
            <DialogDescription>
              Настройки подключения между мерчантом и трейдером
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {singleConnectionModal.connection && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Мерчант</Label>
                    <div className="mt-1 text-sm">
                      {merchants.find(m => m.id === singleConnectionModal.connection?.merchant_id)?.username}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Трейдер</Label>
                    <div className="mt-1 text-sm">
                      {traders.find(t => t.id === singleConnectionModal.connection?.trader_id)?.username}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="single-reward">Награда трейдера (%)</Label>
                  <Input
                    id="single-reward"
                    type="text"
                    placeholder="8.000"
                    value={singleConnectionForm.trader_reward}
                    onChange={(e) => setSingleConnectionForm({
                      ...singleConnectionForm, 
                      trader_reward: validatePercentageInput(e.target.value)
                    })}
                    className={formErrors.trader_reward ? "border-red-500" : ""}
                  />
                  {formErrors.trader_reward && (
                    <div className="text-red-500 text-xs">{formErrors.trader_reward}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="single-priority">Приоритет трейдера</Label>
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
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={singleConnectionForm.enabled}
                    onCheckedChange={(enabled) => setSingleConnectionForm({...singleConnectionForm, enabled})}
                  />
                  <Label>Трафик включен</Label>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setDeleteConnectionDialog({ open: true, connection: singleConnectionModal.connection })}
            >
              Удалить
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSingleConnectionModal({ open: false, connection: null })}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSingleConnectionSave}
                disabled={actionLoading !== null}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Connection Modal */}
      <Dialog open={addConnectionModal.open} onOpenChange={(open) => setAddConnectionModal({ open, trader_id: "" })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить подключение</DialogTitle>
            <DialogDescription>
              Подключение нового мерчанта к трейдеру
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-merchant">Мерчант</Label>
              <Select
                value={newConnectionForm.merchant_id}
                onValueChange={(value) => setNewConnectionForm({...newConnectionForm, merchant_id: value})}
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
                <div className="text-red-500 text-xs">{formErrors.merchant_id}</div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-reward">Награда трейдера (%)</Label>
                <Input
                  id="new-reward"
                  type="text"
                  placeholder="8.000"
                  value={newConnectionForm.trader_reward}
                  onChange={(e) => setNewConnectionForm({
                    ...newConnectionForm, 
                    trader_reward: validatePercentageInput(e.target.value)
                  })}
                  className={formErrors.trader_reward ? "border-red-500" : ""}
                />
                {formErrors.trader_reward && (
                  <div className="text-red-500 text-xs">{formErrors.trader_reward}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-platform-fee">Комиссия платформы (%)</Label>
                <Input
                  id="new-platform-fee"
                  type="text"
                  placeholder="1.000"
                  value={newConnectionForm.platform_fee}
                  onChange={(e) => setNewConnectionForm({
                    ...newConnectionForm, 
                    platform_fee: validatePercentageInput(e.target.value)
                  })}
                  className={formErrors.platform_fee ? "border-red-500" : ""}
                />
                {formErrors.platform_fee && (
                  <div className="text-red-500 text-xs">{formErrors.platform_fee}</div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-priority">Приоритет трейдера</Label>
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
              <Label htmlFor="new-name">Название подключения (опционально)</Label>
              <Input
                id="new-name"
                type="text"
                placeholder="Мерчант - Трейдер"
                value={newConnectionForm.name}
                onChange={(e) => setNewConnectionForm({...newConnectionForm, name: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newConnectionForm.enabled}
                onCheckedChange={(enabled) => setNewConnectionForm({...newConnectionForm, enabled})}
              />
              <Label>Трафик включен</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddConnectionModal({ open: false, trader_id: "" })}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddConnection}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={deleteMerchantDialog.open} onOpenChange={(open) => setDeleteMerchantDialog({ open, merchant: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить все записи трафика для мерчанта {deleteMerchantDialog.merchant?.merchant.username}? 
              Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMerchant}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTraderDialog.open} onOpenChange={(open) => setDeleteTraderDialog({ open, trader: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить все записи трафика для трейдера {deleteTraderDialog.trader?.trader.username}? 
              Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrader}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConnectionDialog.open} onOpenChange={(open) => setDeleteConnectionDialog({ open, connection: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить подключение?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить это подключение? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}