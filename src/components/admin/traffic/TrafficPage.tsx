import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, CheckCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

// Импорты из локальных модулей
import { useTrafficData } from "./hooks/useTrafficData";
import MerchantsTab from "./tabs/MerchantsTab";
import TradersTab from "./tabs/TradersTab";
import AntiFraudTab from "./tabs/AntiFraudTab";
import AuditTab from "./tabs/AuditTab";

// Импорты модалок
import MerchantSettingsModal from "./modals/MerchantSettingsModal";
import CreateRuleModal from "./modals/CreateRuleModal";
import RuleDetailsModal from "./modals/RuleDetailsModal";
import AuditHistoryModal from "./modals/AuditHistoryModal";
import ManualUnlockModal from "./modals/ManualUnlockModal";
import DeleteDialogs from "./modals/DeleteDialogs";
import TraderSettingsModal from "./modals/TraderSettingsModal";
import AddConnectionModal from "./modals/AddConnectionModal";
import SingleConnectionModal from "./modals/SingleConnectionModal";

// Импорты типов и утилит
import { formatDecimal } from "./utils";
import { MerchantTraffic, TrafficRecord, AntiFraudRule, TraderTraffic, User } from "./types";

export default function TrafficPage() {
  const {
    data,
    loading,
    actionLoading,
    setActionLoading,
    fetchData,
    fetchAntiFraudData,
  } = useTrafficData();

  // Состояние для активной вкладки
  const [activeTab, setActiveTab] = useState<string>("merchants");

  // Состояния для модалок
  const [merchantSettingsModal, setMerchantSettingsModal] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [traderSettingsModal, setTraderSettingsModal] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [addConnectionModal, setAddConnectionModal] = useState<{open: boolean; trader_id: string}>({open: false, trader_id: ""});
  const [singleConnectionModal, setSingleConnectionModal] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});
  
  const [createRuleModal, setCreateRuleModal] = useState(false);
  const [ruleModal, setRuleModal] = useState<{open: boolean; rule: AntiFraudRule | null}>({open: false, rule: null});
  const [auditHistoryModal, setAuditHistoryModal] = useState<{open: boolean; trader_id: string; logs: any[]; unlocks: any[]}>({open: false, trader_id: "", logs: [], unlocks: []});
  const [unlockModal, setUnlockModal] = useState<{open: boolean; trader_id: string; trader_name: string}>({open: false, trader_id: "", trader_name: ""});
  
  const [deleteMerchantDialog, setDeleteMerchantDialog] = useState<{open: boolean; merchant: MerchantTraffic | null}>({open: false, merchant: null});
  const [deleteTraderDialog, setDeleteTraderDialog] = useState<{open: boolean; trader: TraderTraffic | null}>({open: false, trader: null});
  const [deleteConnectionDialog, setDeleteConnectionDialog] = useState<{open: boolean; connection: TrafficRecord | null}>({open: false, connection: null});

  // Состояния для форм
  const [merchantSettingsForm, setMerchantSettingsForm] = useState({ merchant_id: "", platform_fee: "" });
  const [unlockForm, setUnlockForm] = useState({ reason: "", grace_period_minutes: 30, admin_id: "" });
  const [newRuleForm, setNewRuleForm] = useState({ name: "", type: "consecutive_orders", config: "{}", priority: 1 });
  
  // Состояния для UI
  const [checkingTrader, setCheckingTrader] = useState<string | null>(null);
  const [selectedTraderForCheck, setSelectedTraderForCheck] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // В начале компонента TrafficPage добавить:
useEffect(() => {
  const hasOpenModal = 
    merchantSettingsModal.open || 
    traderSettingsModal.open || 
    addConnectionModal.open ||
    singleConnectionModal.open ||
    createRuleModal ||
    ruleModal.open ||
    auditHistoryModal.open ||
    unlockModal.open ||
    deleteMerchantDialog.open ||
    deleteTraderDialog.open ||
    deleteConnectionDialog.open;
  
  if (hasOpenModal) {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  } else {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
  
  return () => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };
}, [
  merchantSettingsModal.open,
  traderSettingsModal.open,
  addConnectionModal.open,
  singleConnectionModal.open,
  createRuleModal,
  ruleModal.open,
  auditHistoryModal.open,
  unlockModal.open,
  deleteMerchantDialog.open,
  deleteTraderDialog.open,
  deleteConnectionDialog.open
]);

  // Функции для работы с данными
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

  // Обработчики для мерчантов
  const handleMerchantToggle = async (merchant: MerchantTraffic) => {
    setActionLoading(`merchant-toggle-${merchant.merchant.id}`);
    try {
      await apiClient.patch(`/traffic/merchants/${merchant.merchant.id}?unlocked=${!merchant.merchant_unlocked}`);
      toast({ 
        title: "Статус обновлён", 
        description: `Трафик для мерчанта ${merchant.merchant.username} ${!merchant.merchant_unlocked ? 'разблокирован' : 'заблокирован'}` 
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

  const openMerchantSettings = (merchant: MerchantTraffic) => {
    setMerchantSettingsForm({
      merchant_id: merchant.merchant.id,
      platform_fee: formatDecimal(merchant.platform_fee)
    });
    setMerchantSettingsModal({ open: true, merchant });
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
      const updatePromises = data.trafficRecords
        .filter(record => record.merchant_id === merchantSettingsForm.merchant_id)
        .map(record => 
          apiClient.patch("/admin/traffic/edit", {
            id: record.id,
            platform_fee: platformFee / 100
          })
        );

      await Promise.all(updatePromises);
      toast({ title: "Настройки сохранены", description: "Настройки мерчанта успешно обновлены" });
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

  // Обработчики для трейдеров
  const handleTraderToggle = async (trader: TraderTraffic) => {
    setActionLoading(`trader-toggle-${trader.trader.id}`);
    try {
      await apiClient.patch(`/traffic/traders/${trader.trader.id}?unlocked=${!trader.trader_unlocked}`);
      toast({ 
        title: "Статус обновлён", 
        description: `Трафик для трейдера ${trader.trader.username} ${!trader.trader_unlocked ? 'разблокирован' : 'заблокирован'}` 
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

  const openTraderSettings = (trader: TraderTraffic) => {
    setTraderSettingsModal({ open: true, trader: trader });
  };

  const handleTraderSettingsSave = async (traderId: string, connections: any[]) => {
    setActionLoading(`trader-save-${traderId}`);
    try {
      const updatePromises = connections.map(connection => {
        if (!connection.id || connection.id.startsWith('new-')) {
          return apiClient.post("/admin/traffic/create", {
            trader_id: traderId,
            merchant_id: connection.merchant_id,
            trader_reward: parseFloat(connection.trader_reward) / 100,
            trader_priority: parseFloat(connection.trader_priority),
            platform_fee: 0,
            enabled: true,
            name: connection.name,
            traffic_activity_params: connection.activity_params,
            traffic_antifraud_params: connection.antifraud_params,
            traffic_business_params: connection.business_params
          });
        } else {
          return apiClient.patch("/admin/traffic/edit", {
            id: connection.id,
            trader_reward: parseFloat(connection.trader_reward) / 100,
            trader_priority: parseFloat(connection.trader_priority),
            name: connection.name,
            activity_params: connection.activity_params,
            antifraud_params: connection.antifraud_params,
            business_params: connection.business_params
          });
        }
      });

      await Promise.all(updatePromises);
      toast({ title: "Настройки сохранены", description: "Настройки трейдера успешно обновлены" });
      setTraderSettingsModal({ open: false, trader: null });
      await fetchData();
      // Остаемся на вкладке трейдеров после сохранения
      setActiveTab("traders");
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

  const handleAddTraderConnection = async (traderId: string, connection: any) => {
    setActionLoading(`trader-add-${traderId}`);
    try {
      await apiClient.post("/admin/traffic/create", {
        trader_id: traderId,
        merchant_id: connection.merchant_id,
        trader_reward: parseFloat(connection.trader_reward) / 100,
        trader_priority: parseFloat(connection.trader_priority),
        platform_fee: 0,
        enabled: true,
        name: connection.name,
        traffic_activity_params: connection.activity_params,
        traffic_antifraud_params: connection.antifraud_params,
        traffic_business_params: connection.business_params
      });
      toast({ title: "Подключение добавлено", description: "Новое подключение успешно создано" });
      await fetchData();
      // Остаемся на вкладке трейдеров после добавления
      setActiveTab("traders");
    } catch (err: any) {
      console.error("Ошибка при добавлении подключения:", err);
      toast({ 
        title: "Ошибка добавления", 
        description: err.response?.data?.message || "Не удалось добавить подключение", 
        variant: "destructive" 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTraderConnection = async (connectionId: string) => {
    setActionLoading(`connection-delete-${connectionId}`);
    try {
      await apiClient.delete(`/admin/traffic/${connectionId}`);
      toast({ title: "Подключение удалено", description: "Подключение успешно удалено" });
      await fetchData();
      // Остаемся на вкладке трейдеров после удаления
      setActiveTab("traders");
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

  const handleCheckTrader = async (traderId: string) => {
    setCheckingTrader(traderId);
    setSelectedTraderForCheck(traderId);
    try {
      const response = await apiClient.post(`/antifraud/traders/${traderId}/check`);
      if (response.data.all_passed) {
        toast({ title: "Проверка пройдена", description: "Трейдер прошёл все проверки антифрода" });
      } else {
        toast({ 
          title: "Проверка не пройдена", 
          description: `Провалены правила: ${response.data.failed_rules?.join(", ") || 'не указаны'}`, 
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
      setCheckingTrader(null);
      setSelectedTraderForCheck(null);
    }
  };

  // Обработчики для антифрода
  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    setActionLoading(`rule-toggle-${ruleId}`);
    try {
      await apiClient.patch(`/antifraud/rules/${ruleId}`, { is_active: !currentStatus });
      toast({ 
        title: "Правило обновлено", 
        description: `Правило ${!currentStatus ? 'активировано' : 'деактивировано'}` 
      });
      await fetchAntiFraudData();
      // Остаемся на вкладке антифрода после изменения
      setActiveTab("antifraud");
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
      
      toast({ title: "Правило создано", description: "Новое правило успешно создано" });
      setCreateRuleModal(false);
      setNewRuleForm({ name: "", type: "consecutive_orders", config: "{}", priority: 1 });
      await fetchAntiFraudData();
      // Остаемся на вкладке антифрода после создания
      setActiveTab("antifraud");
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

  // Обработчики для модалок подключений
  const handleAddConnection = async (connectionData: any) => {
    setActionLoading(`add-connection-${connectionData.trader_id}`);
    try {
      await apiClient.post("/admin/traffic/create", connectionData);
      toast({ title: "Подключение создано", description: "Новое подключение успешно создано" });
      setAddConnectionModal({ open: false, trader_id: "" });
      await fetchData();
      // Остаемся на текущей вкладке
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

  const handleSaveSingleConnection = async (connectionId: string, connectionData: any) => {
    setActionLoading(`save-connection-${connectionId}`);
    try {
      await apiClient.patch("/admin/traffic/edit", {
        id: connectionId,
        ...connectionData
      });
      toast({ title: "Подключение обновлено", description: "Подключение успешно обновлено" });
      setSingleConnectionModal({ open: false, connection: null });
      await fetchData();
      // Остаемся на текущей вкладке
    } catch (err: any) {
      console.error("Ошибка при обновлении подключения:", err);
      toast({ 
        title: "Ошибка обновления", 
        description: err.response?.data?.message || "Не удалось обновить подключение", 
        variant: "destructive" 
      });
    } finally {
      setActionLoading(null);
    }
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

      {/* Управляемые Tabs - используем value и onValueChange */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="merchants">Мерчанты</TabsTrigger>
          <TabsTrigger value="traders">Трейдеры</TabsTrigger>
          <TabsTrigger value="antifraud">Антифрод</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="mt-6">
          <MerchantsTab
            merchants={data.merchantTraffic}
            trafficRecords={data.trafficRecords}
            traders={data.traders}
            actionLoading={actionLoading}
            renderUserInfo={renderUserInfo}
            onOpenMerchantSettings={openMerchantSettings}
            onToggleMerchant={handleMerchantToggle}
            onDeleteMerchant={(merchant) => setDeleteMerchantDialog({ open: true, merchant })}
            onOpenSingleConnection={(connection) => setSingleConnectionModal({ open: true, connection })}
          />
        </TabsContent>

        <TabsContent value="traders" className="mt-6">
          <TradersTab
            traders={data.traderTraffic}
            actionLoading={actionLoading}
            renderUserInfo={renderUserInfo}
            onOpenTraderSettings={openTraderSettings}
            onCheckTrader={handleCheckTrader}
            onViewAuditHistory={async (traderId) => {
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
            }}
            onManualUnlock={(trader) => setUnlockModal({ open: true, trader_id: trader.trader.id, trader_name: trader.trader.username })}
            onDeleteTrader={(trader) => setDeleteTraderDialog({ open: true, trader })}
            checkingTrader={checkingTrader}
          />
        </TabsContent>

        <TabsContent value="antifraud" className="mt-6">
          <AntiFraudTab
            antiFraudRules={data.antiFraudRules}
            actionLoading={actionLoading}
            onCreateRule={() => setCreateRuleModal(true)}
            onToggleRule={handleToggleRule}
            onViewRuleDetails={(rule) => setRuleModal({ open: true, rule })}
            onDeleteRule={async (ruleId) => {
              setActionLoading(`delete-rule-${ruleId}`);
              try {
                await apiClient.delete(`/antifraud/rules/${ruleId}`);
                toast({ title: "Правило удалено", description: "Правило успешно удалено" });
                await fetchAntiFraudData();
                setActiveTab("antifraud");
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
            }}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTab
            auditLogs={data.auditLogs}
            traders={data.traders}
          />
        </TabsContent>
      </Tabs>

      {/* Модалки */}
      <MerchantSettingsModal
        open={merchantSettingsModal.open}
        onOpenChange={(open) => setMerchantSettingsModal({...merchantSettingsModal, open})}
        merchant={merchantSettingsModal.merchant}
        form={merchantSettingsForm}
        setForm={setMerchantSettingsForm}
        formErrors={formErrors}
        actionLoading={actionLoading === `merchant-save-${merchantSettingsForm.merchant_id}`}
        onSave={handleMerchantSettingsSave}
      />

      <TraderSettingsModal
        open={traderSettingsModal.open}
        onOpenChange={(open) => setTraderSettingsModal({...traderSettingsModal, open})}
        trader={traderSettingsModal.trader}
        merchants={data.merchants}
        trafficRecords={data.trafficRecords}
        actionLoading={actionLoading}
        onSave={handleTraderSettingsSave}
        onAddConnection={handleAddTraderConnection}
        onDeleteConnection={handleDeleteTraderConnection}
      />

      <AddConnectionModal
        open={addConnectionModal.open}
        onOpenChange={(open) => setAddConnectionModal({...addConnectionModal, open})}
        traderId={addConnectionModal.trader_id}
        traders={data.traders}
        merchants={data.merchants}
        trafficRecords={data.trafficRecords}
        actionLoading={actionLoading?.startsWith('add-connection-') || false}
        onSave={handleAddConnection}
      />

      <SingleConnectionModal
        open={singleConnectionModal.open}
        onOpenChange={(open) => setSingleConnectionModal({...singleConnectionModal, open})}
        connection={singleConnectionModal.connection}
        merchants={data.merchants}
        traders={data.traders}
        actionLoading={actionLoading?.startsWith('save-connection-') || false}
        onSave={handleSaveSingleConnection}
        onDelete={handleDeleteTraderConnection}
      />

      <ManualUnlockModal
        open={unlockModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setUnlockModal({open: false, trader_id: "", trader_name: ""});
            setUnlockForm({reason: "", grace_period_minutes: 30, admin_id: ""});
          } else {
            setUnlockModal(prev => ({...prev, open}));
          }
        }}
        traderId={unlockModal.trader_id}
        traderName={unlockModal.trader_name}
        form={unlockForm}
        setForm={setUnlockForm}
        actionLoading={actionLoading === `unlock-${unlockModal.trader_id}`}
        onSave={async () => {
          if (!unlockForm.reason.trim()) {
            toast({ 
              title: "Ошибка", 
              description: "Укажите причину разблокировки", 
              variant: "destructive" 
            });
            return;
          }
          const adminId = "temp-admin-id";
          setActionLoading(`unlock-${unlockModal.trader_id}`);
          try {
            const response = await apiClient.post(`/antifraud/traders/${unlockModal.trader_id}/manual-unlock`, {
              admin_id: adminId,
              reason: unlockForm.reason,
              grace_period_hours: Math.ceil(unlockForm.grace_period_minutes / 60)
            });
            const gracePeriodUntil = new Date(response.data.grace_period_until);
            toast({ 
              title: "Трейдер разблокирован", 
              description: `Грейс-период действует до ${gracePeriodUntil.toLocaleString('ru-RU')}` 
            });
            setUnlockModal({open: false, trader_id: "", trader_name: ""});
            setUnlockForm({reason: "", grace_period_minutes: 30, admin_id: ""});
            await Promise.all([fetchData(), fetchAntiFraudData()]);
            setActiveTab("traders");
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
        }}
      />

      <CreateRuleModal
        open={createRuleModal}
        onOpenChange={setCreateRuleModal}
        form={newRuleForm}
        setForm={setNewRuleForm}
        actionLoading={actionLoading === "create-rule"}
        onCreate={handleCreateRule}
      />

      <RuleDetailsModal
        open={ruleModal.open}
        onOpenChange={(open) => setRuleModal({open, rule: null})}
        rule={ruleModal.rule}
      />

      <AuditHistoryModal
        open={auditHistoryModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setAuditHistoryModal({open: false, trader_id: "", logs: [], unlocks: []});
          }
        }}
        traderId={auditHistoryModal.trader_id}
        logs={auditHistoryModal.logs}
        unlocks={auditHistoryModal.unlocks}
        traders={data.traders}
      />

      <DeleteDialogs
        deleteMerchantDialog={deleteMerchantDialog}
        setDeleteMerchantDialog={setDeleteMerchantDialog}
        deleteTraderDialog={deleteTraderDialog}
        setDeleteTraderDialog={setDeleteTraderDialog}
        deleteConnectionDialog={deleteConnectionDialog}
        setDeleteConnectionDialog={setDeleteConnectionDialog}
        actionLoading={actionLoading}
        onDeleteMerchant={async () => {
          if (!deleteMerchantDialog.merchant) return;
          setActionLoading(`merchant-delete-${deleteMerchantDialog.merchant.merchant.id}`);
          try {
            const deletePromises = data.trafficRecords
              .filter(record => record.merchant_id === deleteMerchantDialog.merchant!.merchant.id)
              .map(record => apiClient.delete(`/admin/traffic/${record.id}`));
            await Promise.all(deletePromises);
            toast({ 
              title: "Мерчант удалён", 
              description: `Все записи трафика для ${deleteMerchantDialog.merchant.merchant.username} удалены` 
            });
            setDeleteMerchantDialog({ open: false, merchant: null });
            await fetchData();
            setActiveTab("merchants");
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
        }}
        onDeleteTrader={async () => {
          if (!deleteTraderDialog.trader) return;
          setActionLoading(`trader-delete-${deleteTraderDialog.trader.trader.id}`);
          try {
            const deletePromises = deleteTraderDialog.trader.connections.map(connection =>
              apiClient.delete(`/admin/traffic/${connection.id}`)
            );
            await Promise.all(deletePromises);
            toast({ 
              title: "Трейдер удалён", 
              description: `Все записи трафика для ${deleteTraderDialog.trader.trader.username} удалены` 
            });
            setDeleteTraderDialog({ open: false, trader: null });
            await fetchData();
            setActiveTab("traders");
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
        }}
        onDeleteConnection={async () => {
          if (!deleteConnectionDialog.connection) return;
          setActionLoading(`connection-delete-${deleteConnectionDialog.connection.id}`);
          try {
            await apiClient.delete(`/admin/traffic/${deleteConnectionDialog.connection.id}`);
            toast({ title: "Подключение удалено", description: "Подключение успешно удалено" });
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
        }}
      />
    </div>
  );
}