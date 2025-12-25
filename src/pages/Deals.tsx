import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Filter, CalendarIcon, Eye, ChevronLeft, ChevronRight, Copy, CheckCheck, Clock, PauseCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { dealService, Deal } from "@/services/dealService";
import { convertGoTimeToJSDate, safeFormatDate } from "@/lib/date-utils";
import apiClient from "@/lib/api-client";

// Функции форматирования из старого проекта
const formatCardNumber = (number: string) => {
  return number.replace(/(\d{4})/g, '$1 ').trim();
};

const formatPhoneNumber = (phone: string) => {
  const match = phone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
};

// Интерфейс для диспута
interface Dispute {
  dispute_id: string;
  proof_url: string;
  dispute_reason: string;
  dispute_status: string;
  dispute_amount_fiat: number;
  dispute_amount_crypto: number;
  dispute_crypto_rate: number;
  accept_at: string;
  order_id: string;
  order: {
    order_id: string;
    merchant_order_id: string;
    amount_fiat: number;
    crypro_rate: number;
    amount_crypto: number;
    bank_detail: {
      bank_name: string;
      card_number: string;
      owner: string;
      payment_system: string;
      phone: string;
      trader_id: string;
    };
  };
}

// Хук для управления таймерами
const useDealTimers = (deals: Deal[], activeTab: string) => {
  const [timers, setTimers] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (activeTab !== 'active' && activeTab !== 'dispute') {
      setTimers({});
      return;
    }

    const initialTimers: {[key: string]: number} = {};
    deals.forEach(deal => {
      if (deal.expires_at) {
        const expiresAt = new Date(deal.expires_at).getTime();
        const now = Date.now();
        const diffMs = expiresAt - now;
        initialTimers[deal.id] = Math.max(0, diffMs);
      }
    });
    setTimers(initialTimers);

    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const updatedTimers: {[key: string]: number} = {};
        let hasActiveTimers = false;

        Object.keys(prevTimers).forEach(dealId => {
          const deal = deals.find(d => d.id === dealId);
          if (deal && deal.expires_at) {
            const expiresAt = new Date(deal.expires_at).getTime();
            const now = Date.now();
            const diffMs = expiresAt - now;
            
            if (diffMs > 0) {
              updatedTimers[dealId] = diffMs;
              hasActiveTimers = true;
            } else {
              updatedTimers[dealId] = 0;
            }
          }
        });

        if (!hasActiveTimers) {
          clearInterval(interval);
        }

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deals, activeTab]);

  return timers;
};

// Функция для форматирования времени обратного отсчета
const formatCountdown = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Deals() {
  const [searchId, setSearchId] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingDeal, setApprovingDeal] = useState<string | null>(null);
  const [acceptingDispute, setAcceptingDispute] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Timer state for active deals
  const [currentTime, setCurrentTime] = useState(new Date());

  const { userID } = useAuth();
  const { toast } = useToast();

  // Update timer every second for active deals
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Загрузка диспутов
  const loadDisputes = async () => {
    if (!userID) return;
    
    setLoading(true);
    try {
      // Делаем два раздельных запроса для разных статусов
      const [openedDisputesResponse, freezedDisputesResponse] = await Promise.all([
        apiClient.get('/admin/orders/disputes', {
          params: {
            page: currentPage,
            limit: pageSize,
            status: 'DISPUTE_OPENED',
            traderId: userID,
            orderId: searchId || undefined,
          }
        }),
        apiClient.get('/admin/orders/disputes', {
          params: {
            page: currentPage,
            limit: pageSize,
            status: 'DISPUTE_FREEZED',
            traderId: userID,
            orderId: searchId || undefined,
          }
        })
      ]);

      // Объединяем результаты
      const openedDisputes = openedDisputesResponse.data.disputes || [];
      const freezedDisputes = freezedDisputesResponse.data.disputes || [];
      const allDisputes = [...openedDisputes, ...freezedDisputes];

      setDisputes(allDisputes);
      
      // Для пагинации используем сумму total_items из обоих запросов
      const openedTotal = openedDisputesResponse.data.pagination?.total_items || 0;
      const freezedTotal = freezedDisputesResponse.data.pagination?.total_items || 0;
      setTotalItems(openedTotal + freezedTotal);
      
      setDeals([]);
    } catch (error: any) {
      console.error("Ошибка загрузки диспутов:", error);
      toast({
        title: "Ошибка загрузки диспутов",
        description: error.response?.data?.message || "Не удалось загрузить диспуты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка обычных сделок
  const loadDeals = async () => {
    if (!userID) return;
    
    setLoading(true);
    try {
      let status = "";
      switch (activeTab) {
        case "active": status = "PENDING"; break;
        case "completed": status = "COMPLETED"; break;
        case "cancelled": status = "CANCELED"; break;
      }
      
      const filters = {
        page: currentPage,
        limit: pageSize,
        status,
        searchId: searchId || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        dateFrom,
        dateTo,
      };
      
      const response = await dealService.getDeals(userID, filters);
      setDeals(response.orders);
      setDisputes([]);
      setTotalItems(response.pagination.total_items);
    } catch (error: any) {
      console.error("Ошибка загрузки сделок:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.response?.data?.message || "Не удалось загрузить список сделок",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при изменении параметров
  useEffect(() => {
    if (activeTab === "dispute") {
      loadDisputes();
    } else {
      loadDeals();
    }
  }, [userID, activeTab, currentPage, pageSize, searchId, minAmount, maxAmount, dateFrom, dateTo]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Активна", variant: "default" as const },
      COMPLETED: { label: "Завершена", variant: "secondary" as const },
      CANCELLED: { label: "Отменена", variant: "destructive" as const },
      CANCELED: { label: "Отменена", variant: "destructive" as const },
      DISPUTE: { label: "Спор", variant: "outline" as const },
      DISPUTE_OPENED: { label: "Открыт", variant: "default" as const },
      DISPUTE_FREEZED: { label: "На паузе", variant: "secondary" as const },
      DISPUTE_ACCEPTED: { label: "Принят", variant: "outline" as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const };
  };

  const dealTimers = useDealTimers(deals, activeTab);

  // Функция для отображения времени для диспутов
  const getDisputeTimeDisplay = (dispute: Dispute) => {
    if (!dispute.accept_at) return "—";
    
    try {
      const acceptAt = new Date(dispute.accept_at).getTime();
      const now = currentTime.getTime();
      const remainingMs = acceptAt - now;
      
      if (remainingMs <= 0) {
        return <span className="text-red-500 font-semibold">00:00:00</span>;
      }
      
      const timeString = formatCountdown(remainingMs);
      
      return (
        <span className={`font-mono ${
          remainingMs < 300000 ? 'text-red-500 animate-pulse' : 
          remainingMs < 900000 ? 'text-orange-500' : 
          'text-green-500'
        }`}>
          {timeString}
        </span>
      );
    } catch (error) {
      console.error('Error calculating dispute countdown:', error);
      return "—";
    }
  };

  // Функция для отображения времени для обычных сделок
  const getDealTimeDisplay = (deal: Deal, status: string) => {
    if (status === "active" && deal.expires_at) {
      try {
        const expiresAt = new Date(deal.expires_at).getTime();
        const now = currentTime.getTime();
        const remainingMs = expiresAt - now;
        
        if (remainingMs <= 0) {
          return <span className="text-red-500 font-semibold">00:00:00</span>;
        }
        
        const timeString = formatCountdown(remainingMs);
        
        return (
          <span className={`font-mono ${
            remainingMs < 300000 ? 'text-red-500 animate-pulse' : 
            remainingMs < 900000 ? 'text-orange-500' : 
            'text-green-500'
          }`}>
            {timeString}
          </span>
        );
      } catch (error) {
        console.error('Error calculating countdown:', error);
        return "—";
      }
    } else {
      const completedDate = deal.status === "COMPLETED" || deal.status === "CANCELED" ? deal.updated_at : null;
      return completedDate ? safeFormatDate(completedDate, "dd.MM.yyyy HH:mm:ss") : "—";
    }
  };

  const getTimeColumnHeader = (status: string) => {
    switch (status) {
      case "active": return "Осталось времени";
      case "completed": return "Завершено в";
      case "cancelled": return "Отменено в";
      case "dispute": return "Таймер";
      default: return "Время";
    }
  };

  const handleApproveDeal = async (dealId: string) => {
    setApprovingDeal(dealId);
    try {
      await dealService.approveDeal(dealId);
      toast({
        title: "Сделка подтверждена",
        description: "Сделка успешно подтверждена",
      });
      
      // Обновляем список сделок
      const filters = {
        page: currentPage,
        limit: pageSize,
        status: "PENDING",
      };
      
      const response = await dealService.getDeals(userID!, filters);
      setDeals(response.orders);
    } catch (error: any) {
      console.error("Ошибка подтверждения сделки:", error);
      toast({
        title: "Ошибка подтверждения",
        description: error.response?.data?.message || "Не удалось подтвердить сделку",
        variant: "destructive",
      });
    } finally {
      setApprovingDeal(null);
    }
  };

  const handleAcceptDispute = async (disputeId: string) => {
    setAcceptingDispute(disputeId);
    try {
      await apiClient.post('/admin/disputes/accept', { dispute_id: disputeId });
      toast({
        title: "Диспут принят",
        description: "Диспут успешно принят",
      });
      
      // Обновляем список диспутов
      await loadDisputes();
    } catch (error: any) {
      console.error("Ошибка принятия диспута:", error);
      toast({
        title: "Ошибка принятия",
        description: error.response?.data?.message || "Не удалось принять диспут",
        variant: "destructive",
      });
    } finally {
      setAcceptingDispute(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
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

  const DisputeIdCell = ({ disputeId }: { disputeId: string }) => {
    const shortId = disputeId.length > 8 ? `${disputeId.substring(0, 4)}...${disputeId.slice(-4)}` : disputeId;
    
    return (
      <div 
        className="flex items-center gap-1 text-xs font-mono cursor-pointer hover:text-foreground transition-colors"
        onClick={() => copyToClipboard(disputeId, `dispute-${disputeId}`)}
        title="Нажмите, чтобы скопировать ID диспута"
      >
        {shortId}
        {copyStatus[`dispute-${disputeId}`] ? (
          <CheckCheck className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </div>
    );
  };

  // Функция для преобразования данных сделки
  const transformDealData = (deal: Deal) => {
    if (deal.device && deal.paymentMethod) {
      return {
        ...deal,
        id: deal.order_id || deal.id,
        createdAt: deal.createdAt ? (typeof deal.createdAt === 'string' ? convertGoTimeToJSDate(deal.createdAt) : deal.createdAt) : null,
        completedAt: deal.completedAt ? (typeof deal.completedAt === 'string' ? convertGoTimeToJSDate(deal.completedAt) : deal.completedAt) : null,
      };
    }

    const createdAt = deal.created_at 
      ? convertGoTimeToJSDate(deal.created_at) 
      : null;

    const completedAt = deal.updated_at && deal.status === "COMPLETED" 
      ? convertGoTimeToJSDate(deal.updated_at) 
      : null;

    const getPaymentMethod = (system: string) => {
      const methods: { [key: string]: string } = {
        'SBP': 'СБП',
        'C2C': 'Карта',
        'BANK': 'Банковский перевод'
      };
      return methods[system] || system;
    };

    const formatPaymentDetails = (bankDetail: any) => {
      if (bankDetail?.phone) {
        return formatPhoneNumber(bankDetail.phone);
      }
      if (bankDetail?.card_number) {
        return formatCardNumber(bankDetail.card_number);
      }
      return "—";
    };

    const transformed: Deal = {
      ...deal,
      id: deal.order_id,
      device: deal.device_id || "-",
      paymentMethod: getPaymentMethod(deal.bank_detail?.payment_system || ""),
      bank: deal.bank_detail?.bank_name || "",
      paymentDetails: formatPaymentDetails(deal.bank_detail),
      ownerName: deal.bank_detail?.owner || "",
      amount: `${deal.amount_fiat.toLocaleString("ru-RU")} ₽`,
      amountUSDT: `${deal.amount_crypto.toFixed(2)} USDT`,
      exchangeRate: deal.crypto_rub_rate,
      traderReward: `${(deal.amount_crypto * deal.trader_reward).toFixed(2)} USDT`,
      createdAt: createdAt,
      completedAt: completedAt,
      status: deal.status,
    };

    return transformed;
  };

  // Функция для отображения суммы диспута
  const renderDisputeAmount = (dispute: Dispute) => {
    const isAmountDifferent = dispute.dispute_amount_fiat !== dispute.order.amount_fiat;
    
    return (
      <div className="space-y-1">
        {isAmountDifferent ? (
          <>
            <div className="text-sm font-semibold whitespace-nowrap">
              <s className="text-muted-foreground mr-2">
                {dispute.order.amount_fiat.toLocaleString("ru-RU")} ₽
              </s>
              <span className="text-red-600">
                {dispute.dispute_amount_fiat.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            {/* <div className="text-xs text-muted-foreground">
              Сумма сделки отличается от суммы диспута
            </div> */}
          </>
        ) : (
          <div className="text-sm font-semibold whitespace-nowrap">
            {dispute.dispute_amount_fiat.toLocaleString("ru-RU")} ₽
          </div>
        )}
        <div className="text-sm text-success font-semibold whitespace-nowrap">
          {dispute.dispute_amount_crypto.toFixed(2)} USDT
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {dispute.dispute_crypto_rate.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽/USDT
        </div>
        {/* {isAmountDifferent && (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            Курс сделки: {dispute.order.crypro_rate.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽/USDT
          </div>
        )} */}
      </div>
    );
  };

  const formatDateTimeWithTimezone = (dateString: string): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timeZone
      }).format(date);
    } catch (error) {
      console.error('Error formatting date with timezone:', error);
      return "—";
    }
  };

  // Группируем диспуты по статусу для отображения
  const groupedDisputes = useMemo(() => {
    const opened = disputes.filter(d => d.dispute_status === 'DISPUTE_OPENED');
    const freezed = disputes.filter(d => d.dispute_status === 'DISPUTE_FREEZED');
    return { opened, freezed };
  }, [disputes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Сделки</h1>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Поиск и фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск по ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Введите ID сделки" 
                  value={searchId} 
                  onChange={(e) => setSearchId(e.target.value)} 
                  className="pl-9" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Мин. сумма (RUB)</label>
              <Input 
                type="number" 
                placeholder="0" 
                value={minAmount} 
                onChange={(e) => setMinAmount(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Макс. сумма (RUB)</label>
              <Input 
                type="number" 
                placeholder="1000000" 
                value={maxAmount} 
                onChange={(e) => setMaxAmount(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Время от</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Время до</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy") : "выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 bg-transparent h-auto sm:h-12 text-xs sm:text-sm gap-1 sm:gap-0 p-1">
                <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Активные
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Завершенные
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Отмененные
                </TabsTrigger>
                <TabsTrigger value="dispute" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Споры
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Загрузка данных...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Устройство</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground min-w-[320px]">Реквизиты</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Сумма сделки</th>
                          {activeTab === "dispute" ? (
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Таймер</th>
                          ) : (
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                              {activeTab === "active" ? "Осталось времени" : 
                               activeTab === "completed" ? "Завершено в" : "Отменено в"}
                            </th>
                          )}
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Рендеринг диспутов */}
                        {activeTab === "dispute" && (
                          <>
                            {/* Открытые диспуты */}
                            {groupedDisputes.opened.map((dispute) => {
                              const bankDetail = dispute.order.bank_detail;
                              const getPaymentMethod = (system: string) => {
                                const methods: { [key: string]: string } = {
                                  'SBP': 'СБП',
                                  'C2C': 'Карта',
                                  'BANK': 'Банковский перевод'
                                };
                                return methods[system] || system;
                              };

                              const formatPaymentDetails = (bankDetail: any) => {
                                if (bankDetail?.phone) {
                                  return formatPhoneNumber(bankDetail.phone);
                                }
                                if (bankDetail?.card_number) {
                                  return formatCardNumber(bankDetail.card_number);
                                }
                                return "—";
                              };

                              return (
                                <tr key={dispute.dispute_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                  <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">
                                    <OrderIdCell orderId={dispute.order.order_id} />
                                  </td>
                                  <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">—</td>
                                  <td className="py-3 px-4 min-w-[320px]">
                                    <div className="space-y-1">
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Метод:</span>
                                        <span className="text-sm font-medium">{getPaymentMethod(bankDetail.payment_system)}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Банк:</span>
                                        <span className="text-sm">{bankDetail.bank_name}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Реквизит:</span>
                                        <span className="text-sm font-mono">{formatPaymentDetails(bankDetail)}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">ФИО:</span>
                                        <span className="text-sm">{bankDetail.owner}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-semibold">
                                    {renderDisputeAmount(dispute)}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                    {getDisputeTimeDisplay(dispute)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2 items-center">
                                      {/* Кнопка принять для открытых диспутов */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="outline" disabled={acceptingDispute === dispute.dispute_id}>
                                            {acceptingDispute === dispute.dispute_id ? (
                                              <>
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                Принятие...
                                              </>
                                            ) : (
                                              "Принять"
                                            )}
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Принятие диспута</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Вы действительно хотите принять диспут {dispute.dispute_id}? 
                                              Это действие нельзя будет отменить.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAcceptDispute(dispute.dispute_id)}>
                                              Принять
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      {/* Кнопка подробнее */}
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle>Подробности диспута</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-3">
                                                <h4 className="font-semibold">Информация о сделке</h4>
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">ID сделки:</span>
                                                    <span className="font-mono"><OrderIdCell orderId={dispute.order.order_id} /></span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Статус:</span>
                                                    <Badge variant={getStatusBadge("DISPUTE").variant}>
                                                      {getStatusBadge("DISPUTE").label}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-3">
                                                <h4 className="font-semibold">Финансовая информация</h4>
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма сделки:</span>
                                                    <span className="font-semibold">{dispute.order.amount_fiat.toLocaleString("ru-RU")} ₽</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма диспута:</span>
                                                    <span className="font-semibold">{dispute.dispute_amount_fiat.toLocaleString("ru-RU")} ₽</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма в USDT:</span>
                                                    <span className="font-semibold text-success">{dispute.dispute_amount_crypto.toFixed(2)} USDT</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                              <h4 className="font-semibold">Информация о диспуте</h4>
                                              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">ID диспута:</span>
                                                  <span className="font-mono"><DisputeIdCell disputeId={dispute.dispute_id} /></span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Статус диспута:</span>
                                                  <Badge variant={getStatusBadge(dispute.dispute_status).variant}>
                                                    {getStatusBadge(dispute.dispute_status).label}
                                                  </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Причина:</span>
                                                  <span>{dispute.dispute_reason}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Дедлайн:</span>
                                                  <span>{formatDateTimeWithTimezone(dispute.accept_at)}</span>
                                                </div>
                                                {dispute.proof_url && (
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Доказательства:</span>
                                                    <a href={dispute.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                      Посмотреть
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="space-y-3">
                                              <h4 className="font-semibold">Платежные реквизиты</h4>
                                              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Метод платежа:</span>
                                                  <span className="font-medium">{getPaymentMethod(bankDetail.payment_system)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Банк:</span>
                                                  <span>{bankDetail.bank_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Реквизиты:</span>
                                                  <span className="font-mono">{formatPaymentDetails(bankDetail)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Владелец:</span>
                                                  <span>{bankDetail.owner}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Замороженные диспуты */}
                            {groupedDisputes.freezed.map((dispute) => {
                              const bankDetail = dispute.order.bank_detail;
                              const getPaymentMethod = (system: string) => {
                                const methods: { [key: string]: string } = {
                                  'SBP': 'СБП',
                                  'C2C': 'Карта',
                                  'BANK': 'Банковский перевод'
                                };
                                return methods[system] || system;
                              };

                              const formatPaymentDetails = (bankDetail: any) => {
                                if (bankDetail?.phone) {
                                  return formatPhoneNumber(bankDetail.phone);
                                }
                                if (bankDetail?.card_number) {
                                  return formatCardNumber(bankDetail.card_number);
                                }
                                return "—";
                              };

                              return (
                                <tr key={dispute.dispute_id} className="border-b border-border last:border-0 hover:bg-muted/50 bg-muted/30">
                                  <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">
                                    <OrderIdCell orderId={dispute.order.order_id} />
                                  </td>
                                  <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">—</td>
                                  <td className="py-3 px-4 min-w-[320px]">
                                    <div className="space-y-1">
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Метод:</span>
                                        <span className="text-sm font-medium">{getPaymentMethod(bankDetail.payment_system)}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Банк:</span>
                                        <span className="text-sm">{bankDetail.bank_name}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">Реквизит:</span>
                                        <span className="text-sm font-mono">{formatPaymentDetails(bankDetail)}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="text-xs text-muted-foreground min-w-[60px]">ФИО:</span>
                                        <span className="text-sm">{bankDetail.owner}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-semibold">
                                    {renderDisputeAmount(dispute)}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <PauseCircle className="h-4 w-4 text-orange-500" />
                                      <span>На паузе</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2 items-center">
                                      <Badge variant="secondary" className="flex items-center gap-1">
                                        <PauseCircle className="h-3 w-3" />
                                        На паузе
                                      </Badge>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="outline" disabled={acceptingDispute === dispute.dispute_id}>
                                            {acceptingDispute === dispute.dispute_id ? (
                                              <>
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                Принятие...
                                              </>
                                            ) : (
                                              "Принять"
                                            )}
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Принятие диспута</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Вы действительно хотите принять диспут {dispute.dispute_id}? 
                                              Это действие нельзя будет отменить.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAcceptDispute(dispute.dispute_id)}>
                                              Принять
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle>Подробности диспута (на паузе)</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-3">
                                                <h4 className="font-semibold">Информация о сделке</h4>
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">ID сделки:</span>
                                                    <span className="font-mono"><OrderIdCell orderId={dispute.order.order_id} /></span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Статус:</span>
                                                    <Badge variant={getStatusBadge("DISPUTE").variant}>
                                                      {getStatusBadge("DISPUTE").label}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-3">
                                                <h4 className="font-semibold">Финансовая информация</h4>
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма сделки:</span>
                                                    <span className="font-semibold">{dispute.order.amount_fiat.toLocaleString("ru-RU")} ₽</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма диспута:</span>
                                                    <span className="font-semibold">{dispute.dispute_amount_fiat.toLocaleString("ru-RU")} ₽</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Сумма в USDT:</span>
                                                    <span className="font-semibold text-success">{dispute.dispute_amount_crypto.toFixed(2)} USDT</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                              <h4 className="font-semibold">Информация о диспуте</h4>
                                              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">ID диспута:</span>
                                                  <span className="font-mono"><DisputeIdCell disputeId={dispute.dispute_id} /></span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Статус диспута:</span>
                                                  <Badge variant="secondary">
                                                    На паузе
                                                  </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Причина:</span>
                                                  <span>{dispute.dispute_reason}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Дедлайн:</span>
                                                  <span>{formatDateTimeWithTimezone(dispute.accept_at)}</span>
                                                </div>
                                                {dispute.proof_url && (
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Доказательства:</span>
                                                    <a href={dispute.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                      Посмотреть
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="space-y-3">
                                              <h4 className="font-semibold">Платежные реквизиты</h4>
                                              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Метод платежа:</span>
                                                  <span className="font-medium">{getPaymentMethod(bankDetail.payment_system)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Банк:</span>
                                                  <span>{bankDetail.bank_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Реквизиты:</span>
                                                  <span className="font-mono">{formatPaymentDetails(bankDetail)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Владелец:</span>
                                                  <span>{bankDetail.owner}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}

                        {/* Рендеринг обычных сделок */}
                        {activeTab !== "dispute" && deals.map((deal) => {
                          const transformedDeal = transformDealData(deal);
                          return (
                            <tr key={transformedDeal.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-4 font-mono text-sm whitespace-nowrap"><OrderIdCell orderId={transformedDeal.id} /></td>
                              <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">{transformedDeal.device}</td>
                              <td className="py-3 px-4 min-w-[320px]">
                                <div className="space-y-1">
                                  <div className="flex gap-3">
                                    <span className="text-xs text-muted-foreground min-w-[60px]">Метод:</span>
                                    <span className="text-sm font-medium">{transformedDeal.paymentMethod}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-xs text-muted-foreground min-w-[60px]">Банк:</span>
                                    <span className="text-sm">{transformedDeal.bank}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-xs text-muted-foreground min-w-[60px]">Реквизит:</span>
                                    <span className="text-sm font-mono">{transformedDeal.paymentDetails}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-xs text-muted-foreground min-w-[60px]">ФИО:</span>
                                    <span className="text-sm">{transformedDeal.ownerName}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold whitespace-nowrap">{transformedDeal.amount}</div>
                                  <div className="text-sm text-success font-semibold whitespace-nowrap">{transformedDeal.amountUSDT}</div>
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    Курс: {new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transformedDeal.exchangeRate)} ₽/USDT
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                {getDealTimeDisplay(transformedDeal, activeTab)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2 items-center">
                                  {activeTab === "active" && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" disabled={approvingDeal === transformedDeal.id}>
                                          {approvingDeal === transformedDeal.id ? "Подтверждение..." : "Подтвердить"}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Подтверждение сделки</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Вы действительно хотите подтвердить сделку {transformedDeal.id}? Это действие нельзя будет отменить.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Нет</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleApproveDeal(transformedDeal.id)}>
                                            Да
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Подробности сделки {transformedDeal.id}</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-3">
                                            <h4 className="font-semibold">Основная информация</h4>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">ID сделки:</span>
                                                <span className="font-mono"><OrderIdCell orderId={transformedDeal.id} /></span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Статус:</span>
                                                <Badge variant={getStatusBadge(transformedDeal.status).variant}>
                                                  {getStatusBadge(transformedDeal.status).label}
                                                </Badge>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Создана:</span>
                                                <span>{safeFormatDate(transformedDeal.createdAt, "dd.MM.yyyy HH:mm:ss")}</span>
                                              </div>
                                              {transformedDeal.completedAt && (
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Завершена:</span>
                                                  <span>{safeFormatDate(transformedDeal.completedAt, "dd.MM.yyyy HH:mm:ss")}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-3">
                                            <h4 className="font-semibold">Финансовая информация</h4>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Сумма в рублях:</span>
                                                <span className="font-semibold">{transformedDeal.amount}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Сумма в USDT:</span>
                                                <span className="font-semibold text-success">{transformedDeal.amountUSDT}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Курс обмена:</span>
                                                <span>{new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transformedDeal.exchangeRate)} ₽/USDT</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Награда трейдера:</span>
                                                <span className="font-semibold text-success">{transformedDeal.traderReward}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                          <h4 className="font-semibold">Платежные реквизиты</h4>
                                          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Метод платежа:</span>
                                              <span className="font-medium">{transformedDeal.paymentMethod}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Банк:</span>
                                              <span>{transformedDeal.bank}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Реквизиты:</span>
                                              <span className="font-mono">{transformedDeal.paymentDetails}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Владелец:</span>
                                              <span>{transformedDeal.ownerName}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {(deals.length > 0 || disputes.length > 0) && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Показать</span>
                        <Select 
                          value={pageSize.toString()} 
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>из {totalItems} записей</span>
                      </div>

                      <Pagination className="mx-0 w-auto">
                        <PaginationContent className="flex-wrap">
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              className={cn(
                                "cursor-pointer",
                                currentPage <= 1 && "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>
                          
                          {renderPaginationItems()}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              className={cn(
                                "cursor-pointer",
                                currentPage >= totalPages && "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  {deals.length === 0 && disputes.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Данные не найдены</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}