// src/components/History.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, CalendarIcon, Filter, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: number;
  traderId: string;
  currency: string;
  type: string;
  amount: string;
  txHash: string | null;
  orderId: string | null;
  status: string;
  createdAt: string;
}

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  history: Transaction[];
  pagination: PaginationInfo;
}

// Функция для преобразования типа операции
const transformType = (type: string): string => {
  const typeMap: Record<string, string> = {
    "reward": "Награда",
    "release": "Разморозка",
    "freeze": "Заморозка",
    "commission": "Комиссия",
    "replenish": "Пополнение"
  };
  return typeMap[type] || type;
};

// Функция для преобразования статуса
const transformStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    "confirmed": "Подтверждено",
    "pending": "В обработке",
    "rejected": "Отклонено"
  };
  return statusMap[status] || status;
};

// Функция для форматирования даты
const formatApiDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy HH:mm:ss", { locale: ru });
  } catch (error) {
    return dateString;
  }
};

export default function History() {
  const { userID } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Загрузка данных с бэкенда
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userID) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Формируем параметры запроса
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: pageSize.toString()
        };
        
        // Добавляем фильтры, если они заданы
        if (typeFilter && typeFilter !== "all") {
          params.type = typeFilter;
        }
        
        if (dateFrom) {
          params.dateFrom = dateFrom.toISOString().split('T')[0];
        }
        
        if (dateTo) {
          params.dateTo = dateTo.toISOString().split('T')[0];
        }
        
        const response = await apiClient.get<ApiResponse>(`/wallets/${userID}/history`, { params });
        setTransactions(response.data.history);
        setPagination(response.data.pagination);
      } catch (err: any) {
        console.error("Ошибка загрузки истории операций:", err);
        setError(err.response?.data?.message || "Не удалось загрузить историю операций");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userID, currentPage, pageSize, typeFilter, dateFrom, dateTo]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFrom, dateTo]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Подтверждено": { variant: "default" as const, className: "bg-success text-success-foreground" },
      "В обработке": { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
      "Отклонено": { variant: "destructive" as const, className: "" },
      "Ожидание": { variant: "outline" as const, className: "" }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Ожидание"];
  };

  const getAmountColor = (amount: string) => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0) return "text-success";
    if (numericAmount < 0) return "text-destructive";
    return "text-foreground";
  };

  const formatAmount = (amount: string, currency: string) => {
    const numericAmount = parseFloat(amount);
    const sign = numericAmount > 0 ? "+" : numericAmount < 0 ? "-" : "";
    return `${sign}${Math.abs(numericAmount)} ${currency}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">История операций</h1>
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка истории операций...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">История операций</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">История операций</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Тип операции</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="reward">Награда</SelectItem>
                  <SelectItem value="release">Разморозка</SelectItem>
                  <SelectItem value="freeze">Заморозка</SelectItem>
                  <SelectItem value="commission">Комиссия</SelectItem>
                  <SelectItem value="replenish">Пополнение</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">От даты</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
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

            {/* Date To Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">До даты</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
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

            {/* Clear Filters */}
            {(typeFilter !== "all" || dateFrom || dateTo) && (
              <div className="flex flex-col justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter("all");
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setCurrentPage(1);
                  }}
                  className="h-10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Очистить
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Все операции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Сумма</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Тип</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Статус</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Детали</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => {
                  const statusConfig = getStatusBadge(transformStatus(item.status));
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{item.id}</td>
                      <td className={`py-3 px-4 font-semibold ${getAmountColor(item.amount)}`}>
                        {formatAmount(item.amount, item.currency)}
                      </td>
                      <td className="py-3 px-4">{transformType(item.type)}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={statusConfig.variant}
                          className={statusConfig.className}
                        >
                          {transformStatus(item.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatApiDate(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                        {item.orderId ? `Order: ${item.orderId}` : item.txHash || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">История операций пуста</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Показать:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  записей на странице
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, pagination.totalItems)} из {pagination.totalItems}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Назад
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}