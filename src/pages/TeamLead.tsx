// components/team-lead/TeamLeadCabinet.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, Wallet, TrendingUp, Calendar, Filter, Eye, CheckCircle, XCircle, CircleDollarSign, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

// Типы для данных
interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface TeamRelation {
  traderId: string;
  teamRelationRarams: {
    commission: number;
  };
}

interface CommissionProfit {
  totalCommission: number;
  currency: string;
}

interface Statistics {
  total_orders: number;
  succeed_orders: number;
  canceled_orders: number;
  processed_amount_fiat: number;
  processed_amount_crypto: number;
  canceled_amount_fiat: number;
  canceled_amount_crypto: number;
  income_crypto: number;
}

export default function TeamLeadCabinet() {
  const { userID } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTrader, setSelectedTrader] = useState<User | null>(null);
  const [traders, setTraders] = useState<User[]>([]);
  const [teamRelations, setTeamRelations] = useState<TeamRelation[]>([]);
  const [commissionProfit, setCommissionProfit] = useState<CommissionProfit | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [commissionLoading, setCommissionLoading] = useState(false);

  // Функция для форматирования даты в ISO 8601
  const formatToISO = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('.')[0] + 'Z';
  };

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Форматирование комиссии
  const formatCommission = (commission: number) => {
    return (commission * 100).toFixed(1) + '%';
  };

  // Загрузка данных команды
  const fetchTeamData = async () => {
    if (!userID) return;
    
    try {
      setLoading(true);
      
      // Получаем всех трейдеров
      const tradersRes = await apiClient.get<{ users: User[] }>('/admin/users?role=TRADER');
      
      // Получаем команду тимлида
      const relationsRes = await apiClient.get<{ teamRelations: TeamRelation[] }>(
        `/admin/teams/relations/team-lead/${userID}`
      );
      
      setTraders(tradersRes.data.users || []);
      setTeamRelations(relationsRes.data.teamRelations || []);
      
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Ошибка при загрузке данных команды",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Получение заработка с комиссий
  const fetchCommissionProfit = async () => {
    if (!userID) return;
    
    try {
      setCommissionLoading(true);
      
      const params: any = {};
      if (dateFrom) params.from = formatToISO(dateFrom + 'T00:00:00');
      if (dateTo) params.to = formatToISO(dateTo + 'T23:59:59');
      
      const res = await apiClient.get<CommissionProfit>(
        `/wallets/${userID}/commission-profit`,
        { params }
      );
      
      setCommissionProfit(res.data);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Ошибка при загрузке заработка с комиссий",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setCommissionLoading(false);
    }
  };

  // Получение статистики трейдера
  const fetchTraderStatistics = async (traderId: string) => {
    if (!traderId) return;
    
    try {
      setStatsLoading(true);
      
      const params: any = {
        traderID: traderId
      };
      
      if (dateFrom) params.date_from = formatToISO(dateFrom + 'T00:00:00');
      if (dateTo) params.date_to = formatToISO(dateTo + 'T23:59:59');
      
      const res = await apiClient.get<Statistics>(`/admin/orders/statistics`, { params });
      setStatistics(res.data);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Ошибка при загрузке статистики",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Получить трейдеров в команде с дополнительной информацией
  const getTeamTraders = () => {
    return teamRelations.map(relation => {
      const trader = traders.find(t => t.id === relation.traderId);
      return trader ? {
        ...trader,
        commission: relation.teamRelationRarams?.commission || 0
      } : null;
    }).filter(t => t !== null) as (User & { commission: number })[];
  };

  // Быстрые фильтры дат
  const setQuickFilter = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);
    
    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  // Применить фильтры
  const applyFilters = () => {
    fetchCommissionProfit();
    if (selectedTrader) {
      fetchTraderStatistics(selectedTrader.id);
    }
  };

  // Открыть модалку с трейдером
  const openTraderModal = (trader: User & { commission: number }) => {
    setSelectedTrader(trader);
    setStatistics(null);
    fetchTraderStatistics(trader.id);
  };

  // Закрыть модалку
  const closeModal = () => {
    setSelectedTrader(null);
    setStatistics(null);
  };

  // Эффекты загрузки данных
  useEffect(() => {
    if (userID) {
      fetchTeamData();
    }
  }, [userID]);

  useEffect(() => {
    if (userID && dateFrom && dateTo) {
      fetchCommissionProfit();
    }
  }, [userID, dateFrom, dateTo]);

  // Установка начального периода (последние 7 дней)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    setDateFrom(lastWeek.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  const teamTraders = getTeamTraders();
  const teamSize = teamTraders.length;
  const averageCommission = teamSize > 0 
    ? teamTraders.reduce((sum, trader) => sum + trader.commission, 0) / teamSize 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          Кабинет тимлида
        </h1>
      </div>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Фильтры по периоду
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="date-from">От</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">До</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(0)}>
                Сегодня
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(7)}>
                Неделя
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(30)}>
                Месяц
              </Button>
              <Button 
                className="flex items-center gap-2" 
                onClick={applyFilters}
                disabled={commissionLoading}
              >
                <Filter className="h-4 w-4" />
                {commissionLoading ? "Загрузка..." : "Применить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Заработок с комиссий */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Заработок с комиссий</p>
                <p className="text-2xl font-bold">
                  {commissionProfit ? 
                    `${formatAmount(commissionProfit.totalCommission)} ${commissionProfit.currency}` 
                    : commissionLoading ? "Загрузка..." : "0.00"}
                </p>
                {dateFrom && dateTo && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Размер команды */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Размер команды</p>
                <p className="text-2xl font-bold">{teamSize} трейдеров</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Средняя комиссия */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Средняя комиссия</p>
                <p className="text-2xl font-bold">{formatCommission(averageCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Трейдеры в вашей команде</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Загрузка данных команды...</div>
          ) : teamTraders.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">В вашей команде пока нет трейдеров</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Трейдер</TableHead>
                    <TableHead>Логин</TableHead>
                    <TableHead className="text-center">Комиссия</TableHead>
                    <TableHead className="text-center">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamTraders.map((trader) => (
                    <TableRow key={trader.id}>
                      <TableCell className="font-medium">{trader.username || 'Не указано'}</TableCell>
                      <TableCell>{trader.login}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{formatCommission(trader.commission)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openTraderModal(trader)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Статистика
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Статистика трейдера: {trader.username}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {/* Фильтры в модалке */}
                              <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg">
                                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                  <div className="space-y-2">
                                    <Label htmlFor="modal-date-from">От</Label>
                                    <Input
                                      id="modal-date-from"
                                      type="date"
                                      value={dateFrom}
                                      onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="modal-date-to">До</Label>
                                    <Input
                                      id="modal-date-to"
                                      type="date"
                                      value={dateTo}
                                      onChange={(e) => setDateTo(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => fetchTraderStatistics(trader.id)}
                                  disabled={statsLoading}
                                >
                                  {statsLoading ? "Загрузка..." : "Обновить статистику"}
                                </Button>
                              </div>

                              {/* Статистика */}
                              {statistics ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <CircleDollarSign className="h-5 w-5 text-primary" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Всего сделок</p>
                                          <p className="text-xl font-bold">{statistics.total_orders}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Успешные сделки</p>
                                          <p className="text-xl font-bold">{statistics.succeed_orders}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Отмененные сделки</p>
                                          <p className="text-xl font-bold">{statistics.canceled_orders}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Обработано фиата</p>
                                          <p className="text-xl font-bold">{formatAmount(statistics.processed_amount_fiat)} ₽</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <CircleDollarSign className="h-5 w-5 text-primary" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Обработано крипты</p>
                                          <p className="text-xl font-bold">{formatAmount(statistics.processed_amount_crypto)} USD</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-5 w-5 text-red-600" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Отменено фиата</p>
                                          <p className="text-xl font-bold">{formatAmount(statistics.canceled_amount_fiat)} ₽</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <CircleDollarSign className="h-5 w-5 text-red-600" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Отменено крипты</p>
                                          <p className="text-xl font-bold">{formatAmount(statistics.canceled_amount_crypto)} USD</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <Wallet className="h-5 w-5 text-green-600" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-muted-foreground">Чистая прибыль</p>
                                          <p className="text-xl font-bold">{formatAmount(statistics.income_crypto)} USD</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ) : statsLoading ? (
                                <div className="text-center py-8">Загрузка статистики...</div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  Выберите период и нажмите "Обновить статистику"
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}