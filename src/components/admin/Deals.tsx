// tabs/DealsTab.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Handshake, ChevronLeft, ChevronRight, RefreshCw, Copy, CheckCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface Bank {
  code: string;
  name: string;
}

interface Order {
  order_id: string;
  merchant_id: string;
  merchant_order_id: string;
  amount_fiat: number;
  amount_crypto: number;
  crypto_rub_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  bank_detail?: {
    trader_id?: string;
    bank_name?: string;
    bank_code?: string;
    payment_system?: string;
    owner?: string;
    phone?: string;
    card_number?: string;
  };
}

interface Filters {
  traderId: string;
  merchantId: string;
  orderId: string;
  merchantOrderId: string;
  status: string;
  bankCode: string;
  timeOpeningStart: string;
  timeOpeningEnd: string;
  amountMin: string;
  amountMax: string;
  type: string;
  paymentSystem: string;
  deviceId: string;
  sort: string;
}

const statusOptions = ["PENDING", "COMPLETED", "CANCELED", "DISPUTE"];
const typeOptions = ["BUY", "SELL"];
const paymentSystemOptions = ["SBP", "CARD", "C2C"];

const disputeReasonOptions = [
  { value: "UNKNOWN", label: "Неизвестно" },
  { value: "NO_PAYMENT", label: "Нет оплаты" },
  { value: "WRONG_AMOUNT", label: "Неверная сумма" },
  { value: "WRONG_REQUISITE", label: "Неверные реквизиты" }
];

const Timer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState("-");

  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTimer = () => {
      const expiresDate = new Date(expiresAt);
      const now = new Date();
      
      // Используем getTime() для получения числовых значений
      const expiresTime = expiresDate.getTime();
      const nowTime = now.getTime();
      
      if (expiresTime <= nowTime) {
        setTimeLeft("Истекло");
        return;
      }
      
      const diffMs = expiresTime - nowTime;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTimeLeft(`${minutes}м ${seconds}с`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [expiresAt]);

  return <span className="text-sm font-mono">{timeLeft}</span>;
};

export default function DealsTab() {
  const [traders, setTraders] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<User[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    totalPages: 1, 
    totalItems: 0,
    itemsPerPage: 10 
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    dispute_amount_fiat: 0,
    dispute_reason: "NO_PAYMENT",
    proof_url: "",
    ttl: "30",
  });
  const [disputeLoading, setDisputeLoading] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    traderId: "all",
    merchantId: "all",
    orderId: "",
    merchantOrderId: "",
    status: "all",
    bankCode: "all",
    timeOpeningStart: "",
    timeOpeningEnd: "",
    amountMin: "",
    amountMax: "",
    type: "all",
    paymentSystem: "all",
    deviceId: "",
    sort: "created_at desc"
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Функция загрузки сделок с использованием useCallback для стабильной ссылки
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.itemsPerPage,
        sort: filters.sort,
      };
      
      // Используем "all" как специальное значение для "все"
      if (filters.traderId && filters.traderId !== "all") params.trader_id = filters.traderId;
      if (filters.merchantId && filters.merchantId !== "all") params.merchant_id = filters.merchantId;
      if (filters.orderId) params.order_id = filters.orderId;
      if (filters.merchantOrderId) params.merchant_order_id = filters.merchantOrderId;
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.bankCode && filters.bankCode !== "all") params.bank_code = filters.bankCode;
      
      if (filters.timeOpeningStart) {
        const startDate = new Date(filters.timeOpeningStart);
        if (!isNaN(startDate.getTime())) {
          params.time_opening_start = startDate.toISOString();
        }
      }
      
      if (filters.timeOpeningEnd) {
        const endDate = new Date(filters.timeOpeningEnd + "T23:59:59.999Z");
        if (!isNaN(endDate.getTime())) {
          params.time_opening_end = endDate.toISOString();
        }
      }
      
      if (filters.amountMin) params.amount_min = parseFloat(filters.amountMin);
      if (filters.amountMax) params.amount_max = parseFloat(filters.amountMax);
      if (filters.type && filters.type !== "all") params.type = filters.type;
      if (filters.paymentSystem && filters.paymentSystem !== "all") params.payment_system = filters.paymentSystem;
      if (filters.deviceId) params.device_id = filters.deviceId;

      const res = await apiClient.get("/orders/all", { params });
      setOrders(res.data.orders || []);
      
      if (res.data.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: res.data.pagination.total_pages || 1,
          totalItems: res.data.pagination.total_items || 0,
          page: res.data.pagination.current_page || prev.page
        }));
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Ошибка при загрузке сделок:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список сделок",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.itemsPerPage]);

  // Функция для обработки изменений фильтров с debounce
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    // Сбрасываем на первую страницу при изменении фильтров
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Автоматический запрос при изменении фильтров или пагинации с debounce
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Устанавливаем новый таймер с задержкой 500мс
    debounceRef.current = setTimeout(() => {
      fetchOrders();
    }, 500);
    
    // Очистка таймера при размонтировании
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, pagination.page, pagination.itemsPerPage, fetchOrders]);

  // Автообновление
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchOrders();
      }, 10000);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, fetchOrders]);

  // Загрузка пользователей и банков при монтировании
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [tradersRes, teamLeadsRes, merchantsRes] = await Promise.all([
          apiClient.get("/admin/users?role=TRADER"),
          apiClient.get("/admin/users?role=TEAM_LEAD"),
          apiClient.get("/admin/users?role=MERCHANT"),
        ]);

        const combinedTraders = [
          ...(tradersRes.data.users || []),
          ...(teamLeadsRes.data.users || [])
        ];

        setTraders(combinedTraders);
        setMerchants(merchantsRes.data.users || []);
      } catch (err: any) {
        console.error("Ошибка при загрузке списка пользователей", err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить список пользователей",
          variant: "destructive"
        });
      }
    };

    const fetchBanks = async () => {
      try {
        const res = await apiClient.get("/merchant/banks");
        setBanks(res.data || []);
      } catch (err: any) {
        console.error("Ошибка при загрузке списка банков", err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить список банков",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
    fetchBanks();
  }, []);

  // Обработчики изменений
  const handleLimitChange = (value: string) => {
    const newLimit = Number(value);
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newLimit, 
      page: 1 
    }));
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (field: string) => {
    const currentSort = filters.sort.split(" ");
    const currentField = currentSort[0];
    const currentOrder = currentSort[1] || "desc";
    
    if (currentField === field) {
      const newOrder = currentOrder === "asc" ? "desc" : "asc";
      handleFilterChange("sort", `${field} ${newOrder}`);
    } else {
      handleFilterChange("sort", `${field} desc`);
    }
  };

  const renderSortArrow = (field: string) => {
    const currentSort = filters.sort.split(" ");
    if (currentSort[0] !== field) return null;
    return currentSort[1] === "asc" ? " ▲" : " ▼";
  };

  // Функция для проверки, доступна ли кнопка диспута
  const isDisputeAvailable = (status: string) => {
    return status === "COMPLETED" || status === "CANCELED";
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return (
      <div className="space-y-1">
        <div className="text-xs">-</div>
      </div>
    );
    
    const date = new Date(dateString);
    const utcHours = String(date.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
    const utcDate = `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const utcTime = `${utcHours}:${utcMinutes}`;
    
    const localDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
    const localTime = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <div className="space-y-1">
        <div className="text-xs">
          <span className="font-medium">UTC:</span> {utcDate} {utcTime}
        </div>
        <div className="text-xs">
          <span className="font-medium">Лок:</span> {localDate} {localTime}
        </div>
      </div>
    );
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
        description: "Текст скопирован в буфер обмена"
      });
    } catch (err) {
      console.error("Ошибка при копировании:", err);
    }
  };

  const OrderIdCell = ({ orderId }: { orderId: string }) => {
    const shortId = orderId.length > 8 ? `${orderId.substring(0, 4)}...${orderId.slice(-4)}` : orderId;
    
    return (
      <div 
        className="flex items-center gap-1 text-xs font-mono cursor-pointer hover:text-foreground transition-colors"
        onClick={() => copyToClipboard(orderId, `order-${orderId}`)}
        title="Нажмите, чтобы скопировать ID"
      >
        {shortId}
        {copyStatus[`order-${orderId}`] ? (
          <CheckCheck className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </div>
    );
  };

  const UserCell = ({ userId, userList, fallback = "Неизвестный пользователь" }: { 
    userId: string; 
    userList: User[]; 
    fallback?: string;
  }) => {
    const user = userList.find(u => u.id === userId);
    const shortId = userId?.length > 8 ? `${userId.substring(0, 4)}...${userId.slice(-4)}` : userId || "";
    
    if (!userId) {
      return <div className="text-xs text-muted-foreground">Не назначен</div>;
    }
    
    return (
      <div className="space-y-1">
        <div className="text-xs">{user ? user.username : fallback}</div>
        <div 
          className="flex items-center gap-1 text-xs font-mono cursor-pointer hover:text-foreground transition-colors"
          onClick={() => copyToClipboard(userId, `user-${userId}`)}
          title="Нажмите, чтобы скопировать ID"
        >
          {shortId}
          {copyStatus[`user-${userId}`] ? (
            <CheckCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </div>
      </div>
    );
  };

  const BankDetailsCard = ({ bank }: { bank: Order['bank_detail'] }) => {
    if (!bank) return <div className="text-xs text-muted-foreground">Нет данных</div>;
    
    let contactInfo;
    if (bank.payment_system === "SBP") {
        contactInfo = bank.phone || "Не указано";
    } else if (bank.payment_system === "C2C") {
        contactInfo = bank.card_number || "Не указано";
    } else {
        contactInfo = bank.card_number || bank.phone || "Не указано";
    }
    
    return (
      <div className="space-y-1 text-xs">
        <div><span className="font-medium">Банк:</span> {bank.bank_name || "-"}</div>
        {/* <div><span className="font-medium">Код:</span> {bank.bank_code || "-"}</div> */}
        <div><span className="font-medium">ПС:</span> {bank.payment_system || "-"}</div>
        <div><span className="font-medium">Владелец:</span> {bank.owner || "-"}</div>
        <div><span className="font-medium">Реквизиты:</span> {contactInfo}</div>
      </div>
    );
  };

  const AmountCard = ({ amountFiat, amountCrypto, rate }: { 
    amountFiat: number; 
    amountCrypto: number; 
    rate: number;
  }) => (
    <div className="space-y-1 text-xs">
      <div><span className="font-medium">Рубли:</span> {amountFiat} ₽</div>
      <div><span className="font-medium">Крипто:</span> {amountCrypto?.toFixed(6)} USD</div>
      <div><span className="font-medium">Курс:</span> {rate}</div>
    </div>
  );

  const resetFilters = () => {
    setFilters({
      traderId: "all",
      merchantId: "all",
      orderId: "",
      merchantOrderId: "",
      status: "all",
      bankCode: "all",
      timeOpeningStart: "",
      timeOpeningEnd: "",
      amountMin: "",
      amountMax: "",
      type: "all",
      paymentSystem: "all",
      deviceId: "",
      sort: "created_at desc"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatLastUpdated = (date: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const openDisputeDialog = (order: Order) => {
    setSelectedOrder(order);
    setDisputeForm({
      dispute_amount_fiat: order.amount_fiat || 0,
      dispute_reason: "NO_PAYMENT",
      proof_url: "",
      ttl: "30",
    });
    setShowDisputeDialog(true);
  };

  const closeDisputeDialog = () => {
    setShowDisputeDialog(false);
    setSelectedOrder(null);
    setDisputeLoading(false);
  };

  const handleDisputeFormChange = (field: string, value: string | number) => {
    setDisputeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDispute = async () => {
    if (!selectedOrder) return;

    if (!disputeForm.ttl || parseInt(disputeForm.ttl) <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Укажите валидное время жизни диспута",
        variant: "destructive"
      });
      return;
    }

    setDisputeLoading(true);

    try {
      await apiClient.post("/admin/disputes/create", {
        ...disputeForm,
        order_id: selectedOrder.order_id,
        ttl: `${disputeForm.ttl}m`,
      });

      toast({
        title: "Диспут открыт",
        description: "Диспут по сделке успешно открыт"
      });
      closeDisputeDialog();
      fetchOrders();
    } catch (err: any) {
      console.error("Ошибка открытия диспута", err);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть диспут",
        variant: "destructive"
      });
    } finally {
      setDisputeLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "default";
      case "COMPLETED": return "default";
      case "CANCELED": return "destructive";
      case "DISPUTE": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "COMPLETED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "CANCELED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "DISPUTE": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Управление сделками
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header with refresh controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {lastUpdated && `Обновлено: ${formatLastUpdated(lastUpdated)}`}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label className="text-sm">
                  Автообновление {autoRefresh ? 'Вкл' : 'Выкл'}
                </Label>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Обновить
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Трейдер</Label>
              <Select value={filters.traderId} onValueChange={(value) => handleFilterChange("traderId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все трейдеры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все трейдеры</SelectItem>
                  {traders.map(trader => (
                    <SelectItem key={trader.id} value={trader.id}>
                      {trader.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Мерчант</Label>
              <Select value={filters.merchantId} onValueChange={(value) => handleFilterChange("merchantId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все мерчанты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все мерчанты</SelectItem>
                  {merchants.map(merchant => (
                    <SelectItem key={merchant.id} value={merchant.id}>
                      {merchant.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Статус</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Тип сделки</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {typeOptions.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ID сделки</Label>
              <Input
                placeholder="Поиск по ID"
                value={filters.orderId}
                onChange={(e) => handleFilterChange("orderId", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ID заказа мерчанта</Label>
              <Input
                placeholder="Merchant Order ID"
                value={filters.merchantOrderId}
                onChange={(e) => handleFilterChange("merchantOrderId", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Банк</Label>
              <Select value={filters.bankCode} onValueChange={(value) => handleFilterChange("bankCode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все банки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все банки</SelectItem>
                  {banks.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ID устройства</Label>
              <Input
                placeholder="Device ID"
                value={filters.deviceId}
                onChange={(e) => handleFilterChange("deviceId", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Платежная система</Label>
              <Select value={filters.paymentSystem} onValueChange={(value) => handleFilterChange("paymentSystem", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Все системы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все системы</SelectItem>
                  {paymentSystemOptions.map(system => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Сумма от</Label>
              <Input
                type="number"
                min="0"
                placeholder="Мин. сумма (₽)"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange("amountMin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Сумма до</Label>
              <Input
                type="number"
                min="0"
                placeholder="Макс. сумма (₽)"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange("amountMax", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Дата от</Label>
              <Input
                type="date"
                value={filters.timeOpeningStart}
                onChange={(e) => handleFilterChange("timeOpeningStart", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Дата до</Label>
              <Input
                type="date"
                value={filters.timeOpeningEnd}
                onChange={(e) => handleFilterChange("timeOpeningEnd", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Записей на странице</Label>
              <Select value={pagination.itemsPerPage.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">&nbsp;</Label>
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Сбросить фильтры
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Всего сделок: {pagination.totalItems}</span>
            <span>Страница: {pagination.page} из {pagination.totalPages}</span>
          </div>

          {/* Deals Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Загрузка сделок...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Сделок не найдено</p>
              <Button variant="outline" onClick={resetFilters} className="mt-2">
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("order_id")}
                      >
                        ID сделки{renderSortArrow("order_id")}
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Реквизиты
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("amount_fiat")}
                      >
                        Сумма{renderSortArrow("amount_fiat")}
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Мерчант
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Merchant Order ID
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("trader_id")}
                      >
                        Трейдер{renderSortArrow("trader_id")}
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("created_at")}
                      >
                        Создана{renderSortArrow("created_at")}
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("updated_at")}
                      >
                        Обновлена{renderSortArrow("updated_at")}
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("expires_at")}
                      >
                        Таймер{renderSortArrow("expires_at")}
                      </th>
                      <th 
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                        onClick={() => handleSortChange("status")}
                      >
                        Статус{renderSortArrow("status")}
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {orders.map((order) => {
                      const bank = order.bank_detail || {};
                      const traderId = bank?.trader_id || "";
                      
                      return (
                        <tr key={order.order_id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <OrderIdCell orderId={order.order_id} />
                          </td>
                          <td className="p-4 align-middle">
                            <BankDetailsCard bank={bank} />
                          </td>
                          <td className="p-4 align-middle">
                            <AmountCard 
                              amountFiat={order.amount_fiat} 
                              amountCrypto={order.amount_crypto} 
                              rate={order.crypto_rub_rate} 
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <UserCell 
                              userId={order.merchant_id} 
                              userList={merchants} 
                              fallback="Неизвестный мерчант" 
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <div className="text-xs font-mono">{order.merchant_order_id}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <UserCell 
                              userId={traderId} 
                              userList={traders} 
                              fallback="Неизвестный трейдер" 
                            />
                          </td>
                          <td className="p-4 align-middle">
                            {formatDateTime(order.created_at)}
                          </td>
                          <td className="p-4 align-middle">
                            {formatDateTime(order.updated_at)}
                          </td>
                          <td className="p-4 align-middle">
                            <Timer expiresAt={order.expires_at} />
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant={getStatusVariant(order.status)} className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            {isDisputeAvailable(order.status) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDisputeDialog(order)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Диспут
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground px-2 py-1">
                                Недоступно
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Показано {((pagination.page - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems)} из {pagination.totalItems} сделок
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Назад
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => changePage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Вперёд
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={closeDisputeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Открытие диспута</DialogTitle>
            <DialogDescription>
              Открытие диспута для сделки {selectedOrder?.order_id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-amount" className="text-sm font-medium">
                Сумма диспута (₽)
              </Label>
              <Input
                id="dispute-amount"
                type="number"
                min="0"
                step="0.01"
                value={disputeForm.dispute_amount_fiat}
                onChange={(e) => handleDisputeFormChange("dispute_amount_fiat", parseFloat(e.target.value) || 0)}
                placeholder="Введите сумму диспута"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-reason" className="text-sm font-medium">
                Причина диспута
              </Label>
              <Select 
                value={disputeForm.dispute_reason} 
                onValueChange={(value) => handleDisputeFormChange("dispute_reason", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {disputeReasonOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-url" className="text-sm font-medium">
                Ссылка на доказательство
              </Label>
              <Input
                id="proof-url"
                type="text"
                value={disputeForm.proof_url}
                onChange={(e) => handleDisputeFormChange("proof_url", e.target.value)}
                placeholder="URL доказательства (опционально)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-ttl" className="text-sm font-medium">
                Время жизни диспута (минуты)
              </Label>
              <Input
                id="dispute-ttl"
                type="number"
                min="1"
                value={disputeForm.ttl}
                onChange={(e) => handleDisputeFormChange("ttl", e.target.value.replace(/\D/g, ""))}
                placeholder="Введите время в минутах"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDisputeDialog} disabled={disputeLoading}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateDispute} 
              disabled={disputeLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disputeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Открытие...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Открыть диспут
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}