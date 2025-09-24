// tabs/DisputesTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

// Типы для данных
interface User {
  id: string;
  username: string;
  role: string;
}

interface BankDetail {
  bank_name?: string;
  card_number?: string;
  owner?: string;
  payment_system?: string;
  phone?: string;
  trader_id?: string;
}

interface Order {
  order_id?: string;
  merchant_order_id?: string;
  amount_fiat?: number;
  amount_crypto?: number;
  crypro_rate?: number;
  bank_detail?: BankDetail;
}

interface Dispute {
  accept_at?: string;
  dispute_amount_crypto: number;
  dispute_amount_fiat: number;
  dispute_crypto_rate: number;
  dispute_id: string;
  dispute_reason: string;
  dispute_status: string;
  order?: Order;
  order_id: string;
  proof_url: string;
}

interface PaginationResponse {
  current_page: number;
  items_per_page: number;
  total_items: number;
  total_pages: number;
}

interface DisputesResponse {
  disputes: Dispute[];
  pagination: PaginationResponse;
}

const statusLabels: { [key: string]: string } = {
  DISPUTE_OPENED: "Открыт",
  DISPUTE_ACCEPTED: "Принят",
  DISPUTE_REJECTED: "Отклонён",
  DISPUTE_FREEZED: "Заморожен",
};

const actionLabels: { [key: string]: string } = {
  accept: "принять",
  reject: "отклонить",
  freeze: "заморозить",
};

export default function DisputesTab() {
  // Состояния для данных
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filters, setFilters] = useState({
    status: "DISPUTE_OPENED",
    traderId: "",
    merchantId: "",
    disputeId: "",
    orderId: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [traders, setTraders] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<User[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  // Поиск пользователя по ID
  const findUsername = (id: string, list: User[]): string => {
    const user = list.find((u) => u.id === id);
    return user ? user.username : id;
  };

  // Загрузка данных
  const fetchDisputesAndUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
      };
      
      if (filters.traderId) params.traderId = filters.traderId;
      if (filters.merchantId) params.merchantId = filters.merchantId;
      if (filters.disputeId) params.disputeId = filters.disputeId;
      if (filters.orderId) params.orderId = filters.orderId;

      const [disputesRes, tradersRes, teamLeadsRes, merchantsRes] = await Promise.all([
        apiClient.get<DisputesResponse>(`/admin/orders/disputes`, { params }),
        apiClient.get<{ users: User[] }>("/admin/users?role=TRADER"),
        apiClient.get<{ users: User[] }>("/admin/users?role=TEAM_LEAD"),
        apiClient.get<{ users: User[] }>("/admin/users?role=MERCHANT"),
      ]);
      
      const combinedTraders = [
        ...(tradersRes.data.users || []),
        ...(teamLeadsRes.data.users || [])
      ];
      
      setDisputes(disputesRes.data.disputes || []);
      setPagination(prev => ({
        ...prev,
        page: disputesRes.data.pagination?.current_page || 1,
        totalPages: disputesRes.data.pagination?.total_pages || 1,
        totalItems: disputesRes.data.pagination?.total_items || 0,
      }));
      setTraders(combinedTraders);
      setMerchants(merchantsRes.data.users || []);
      updateTimers(disputesRes.data.disputes || []);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Ошибка при загрузке данных",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Обновление таймеров
  const updateTimers = (disputesList: Dispute[]) => {
    const now = Date.now();
    const newTimers: { [key: string]: number } = {};
    disputesList.forEach((d) => {
      if (!d.accept_at) return;
      const acceptAtMs = new Date(d.accept_at).getTime();
      const diffMs = acceptAtMs - now;
      newTimers[d.dispute_id] = diffMs > 0 ? diffMs : 0;
    });
    setTimers(newTimers);
  };

  // Форматирование времени
  const formatMsToTime = (ms: number): string => {
    if (ms <= 0) return "Истекло";
    let totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Обработка действий с диспутами
  const handleAction = async (action: string, disputeId: string) => {
    try {
      await apiClient.post(`/admin/disputes/${action}`, { dispute_id: disputeId });
      toast({
        title: "Успех",
        description: "Действие выполнено",
      });
      fetchDisputesAndUsers();
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Ошибка при выполнении действия",
        variant: "destructive",
      });
      console.error(err);
    }
  };

  // Обработчики фильтров
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setPagination(prev => ({ 
      ...prev, 
      page: 1, 
      limit: newLimit 
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "DISPUTE_OPENED",
      traderId: "",
      merchantId: "",
      disputeId: "",
      orderId: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Эффекты
  useEffect(() => {
    fetchDisputesAndUsers();
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (disputes.length === 0) return;

    const interval = setInterval(() => {
      setTimers((oldTimers) => {
        const now = Date.now();
        const updatedTimers: { [key: string]: number } = {};
        for (const d of disputes) {
          if (!d.accept_at) continue;
          const acceptAtMs = new Date(d.accept_at).getTime();
          const diff = acceptAtMs - now;
          updatedTimers[d.dispute_id] = diff > 0 ? diff : 0;
        }
        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disputes]);

  // Расчет пагинации
  const disputesStartIndex = (pagination.page - 1) * pagination.limit;
  const disputesEndIndex = Math.min(disputesStartIndex + pagination.limit, pagination.totalItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Управление диспутами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 border rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Статус</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Трейдер</label>
            <select 
              value={filters.traderId}
              onChange={(e) => handleFilterChange("traderId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Все трейдеры</option>
              {traders.map(trader => (
                <option key={trader.id} value={trader.id}>
                  {trader.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Мерчант</label>
            <select 
              value={filters.merchantId}
              onChange={(e) => handleFilterChange("merchantId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Все мерчанты</option>
              {merchants.map(merchant => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID диспута</label>
            <input
              type="text"
              placeholder="Фильтр по ID диспута"
              value={filters.disputeId}
              onChange={(e) => handleFilterChange("disputeId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID сделки</label>
            <input
              type="text"
              placeholder="Фильтр по ID сделки"
              value={filters.orderId}
              onChange={(e) => handleFilterChange("orderId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Записей</label>
            <select 
              value={pagination.limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-start">
          <button 
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Сбросить фильтр
          </button>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-4">Нет диспутов</div>
          ) : (
            disputes.map((dispute) => {
              const bank = dispute?.order?.bank_detail;
              const order = dispute?.order;
              const traderUsername = bank?.trader_id ? findUsername(bank.trader_id, traders) : "-";

              return (
                <div key={dispute.dispute_id} className="border rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bank Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Банковские реквизиты</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Банк:</span> {bank?.bank_name || "-"} ({bank?.payment_system || "-"})</p>
                        <p><span className="font-medium">Телефон:</span> {bank?.phone || "-"}</p>
                        <p><span className="font-medium">Владелец:</span> {bank?.owner || "-"}</p>
                        <p><span className="font-medium">Trader:</span> {traderUsername}</p>
                      </div>
                    </div>

                    {/* Deal Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Детали сделки</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Order ID:</span> {order?.order_id || "-"}</p>
                        <p><span className="font-medium">Merchant Order ID:</span> {order?.merchant_order_id || "-"}</p>
                        <p><span className="font-medium">Сумма (₽):</span> {order?.amount_fiat || "-"}</p>
                        <p><span className="font-medium">Сумма (крипто):</span> {order?.amount_crypto?.toFixed(6) || "-"}</p>
                        <p><span className="font-medium">Курс:</span> {order?.crypro_rate || dispute.dispute_crypto_rate || "-"}</p>
                      </div>
                    </div>

                    {/* Dispute Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Детали диспута</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">ID диспута:</span> {dispute.dispute_id}</p>
                        <p><span className="font-medium">Причина:</span> {dispute.dispute_reason}</p>
                        <p>
                          <span className="font-medium">Статус:</span> 
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ml-2 ${
                            dispute.dispute_status === "DISPUTE_OPENED" 
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : dispute.dispute_status === "DISPUTE_FREEZED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }`}>
                            {statusLabels[dispute.dispute_status] || dispute.dispute_status}
                          </span>
                        </p>
                        <p><span className="font-medium">Сумма диспута (₽):</span> {dispute.dispute_amount_fiat}</p>
                        <p><span className="font-medium">Сумма диспута (крипто):</span> {dispute.dispute_amount_crypto.toFixed(6)}</p>
                        <p>
                          <a href={dispute.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Доказательство
                          </a>
                        </p>
                        {dispute.accept_at && (
                          <p><span className="font-medium">До автопринятия:</span> {formatMsToTime(timers[dispute.dispute_id] || 0)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {(dispute.dispute_status === "DISPUTE_OPENED" || dispute.dispute_status === "DISPUTE_FREEZED") && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-9 px-3">
                              Принять
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы точно хотите принять диспут?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAction("accept", dispute.dispute_id)}>
                                Принять диспут
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
                              Отклонить
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы точно хотите отклонить диспут?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAction("reject", dispute.dispute_id)}>
                                Отклонить диспут
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {dispute.dispute_status === "DISPUTE_OPENED" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 h-9 px-3">
                            Заморозить
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы точно хотите заморозить диспут?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAction("freeze", dispute.dispute_id)}>
                              Заморозить диспут
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {disputes.length > 0 ? (
              `Показано ${disputesStartIndex + 1}-${disputesEndIndex} из ${pagination.totalItems} диспутов`
            ) : (
              "Нет диспутов для отображения"
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
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
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
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
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Вперёд
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}