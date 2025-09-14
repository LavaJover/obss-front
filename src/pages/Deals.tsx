import { useState, useEffect } from "react";
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
import { Search, Filter, CalendarIcon, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { dealService, Deal } from "@/services/dealService";
import { convertGoTimeToJSDate, safeFormatDate } from "@/lib/date-utils"; // Добавлен импорт

// Функции форматирования из старого проекта
const formatCardNumber = (number: string) => {
  return number.replace(/(\d{4})/g, '$1 ').trim();
};

const formatPhoneNumber = (phone: string) => {
  const match = phone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
};

export default function Deals() {
  const [searchId, setSearchId] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingDeal, setApprovingDeal] = useState<string | null>(null);
  
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

  // Загрузка сделок
  useEffect(() => {
    const loadDeals = async () => {
      if (!userID) return;
      
      setLoading(true);
      try {
        // Преобразуем статусы между старой и новой системой
        let status = "";
        switch (activeTab) {
          case "active": status = "PENDING"; break;
          case "completed": status = "COMPLETED"; break;
          case "cancelled": status = "CANCELED"; break;
          case "dispute": status = "DISPUTE"; break;
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

    loadDeals();
  }, [userID, activeTab, currentPage, pageSize, searchId, minAmount, maxAmount, dateFrom, dateTo, toast]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Активна", variant: "default" as const },
      COMPLETED: { label: "Завершена", variant: "secondary" as const },
      CANCELLED: { label: "Отменена", variant: "destructive" as const },
      DISPUTE: { label: "Спор", variant: "outline" as const }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const getTimeDisplay = (deal: Deal, status: string) => {
    if (status === "active" && deal.expires_at) {
      // Используем convertGoTimeToJSDate для expires_at
      const expiresAt = convertGoTimeToJSDate(deal.expires_at);
      if (isNaN(expiresAt.getTime())) return "—";
      
      const now = currentTime;
      // Вычисляем разницу между expiresAt и now (оставшееся время)
      const diffMs = expiresAt.getTime() - now.getTime();
      
      // Если время истекло, показываем 0
      if (diffMs <= 0) {
        return "00:00:00";
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return deal.completedAt ? safeFormatDate(deal.completedAt, "dd.MM.yyyy HH:mm:ss") : "—";
    }
  };

  const getTimeColumnHeader = (status: string) => {
    switch (status) {
      case "active": return "Таймер";
      case "completed": return "Завершено в";
      case "cancelled": return "Отменено в";
      case "dispute": return "Отменено в";
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
      // Always show first page
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

      // Show ellipsis if needed
      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      // Show pages around current page
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

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      // Always show last page
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

  // Функция для преобразования данных из старого формата в новый
  const transformDealData = (deal: Deal) => {
    // Если данные уже в новом формате, возвращаем как есть
    if (deal.device && deal.paymentMethod) {
      return deal;
    }
    
    // Преобразуем из старого формата в новый
    // Используем convertGoTimeToJSDate для преобразования дат
    const createdAt = deal.createdAt ? convertGoTimeToJSDate(deal.createdAt).toISOString() : new Date().toISOString();
    const completedAt = deal.completedAt ? convertGoTimeToJSDate(deal.completedAt).toISOString() : null;
  
    return {
      id: deal.order_id || deal.id,
      device: deal.device || "Устройство #1",
      paymentMethod: deal.bank_detail?.payment_system || "",
      bank: deal.bank_detail?.bank_name || "",
      paymentDetails: deal.bank_detail?.card_number 
        ? formatCardNumber(deal.bank_detail.card_number)
        : deal.bank_detail?.phone 
        ? formatPhoneNumber(deal.bank_detail.phone)
        : "",
      ownerName: deal.bank_detail?.owner || "",
      amount: deal.amount_fiat ? `${deal.amount_fiat.toLocaleString('ru-RU')} ₽` : "",
      amountUSDT: deal.amount_crypto ? `${deal.amount_crypto.toFixed(2)} USDT` : "",
      exchangeRate: deal.crypto_rub_rate ? deal.crypto_rub_rate.toString() : "",
      traderReward: deal.trader_reward 
        ? `${(deal.amount_crypto! * deal.trader_reward).toFixed(2)} USDT` 
        : "",
      createdAt,
      completedAt,
      status: deal.status,
      // Сохраняем оригинальные поля
      ...deal
    };
  };

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
                  <p className="mt-4 text-muted-foreground">Загрузка сделок...</p>
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
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Создана в</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">{getTimeColumnHeader(activeTab)}</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.map((deal) => {
                          const transformedDeal = transformDealData(deal);
                          return (
                            <tr key={transformedDeal.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">{transformedDeal.id}</td>
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
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">Курс: {transformedDeal.exchangeRate} ₽/USDT</div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                {safeFormatDate(transformedDeal.createdAt, "dd.MM.yyyy HH:mm:ss")}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground font-mono whitespace-nowrap">
                                {getTimeDisplay(transformedDeal, activeTab)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2 items-center">
                                  {/* Кнопка подтвердить - не показывать для отмененных и завершенных */}
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
                                  
                                  {/* Кнопка подробнее */}
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
                                                <span className="font-mono">{transformedDeal.id}</span>
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
                                                <span>{transformedDeal.exchangeRate} ₽/USDT</span>
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
                  {deals.length > 0 && (
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

                  {deals.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Сделки не найдены</p>
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