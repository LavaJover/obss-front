// tabs/TraderStatsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, BarChart3, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import apiClient from "@/lib/api-client";
import { ru } from "date-fns/locale";

export default function TraderStatsTab() {
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [dateTo, setDateTo] = useState<Date>(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  });
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  // Загрузка пользователей (трейдеры, мерчанты, тимлиды)
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const [tradersRes, teamLeadsRes, merchantsRes] = await Promise.all([
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD"),
        apiClient.get("/admin/users?role=MERCHANT"),
      ]);

      const combinedUsers = [
        ...(tradersRes.data.users || []),
        ...(teamLeadsRes.data.users || []),
        ...(merchantsRes.data.users || [])
      ];

      setUsers(combinedUsers);
    } catch (e) {
      console.error("Ошибка при загрузке пользователей", e);
      setError("Ошибка при загрузке списка пользователей");
    } finally {
      setUsersLoading(false);
    }
  };

  // Загрузка статистики для выбранного пользователя
  const fetchStatistics = async () => {
    if (!selectedUserId) {
      setStats(null);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const from = dateFrom.toISOString();
      const to = dateTo.toISOString();

      const response = await apiClient.get("/admin/orders/statistics", {
        params: {
          traderID: selectedUserId,
          date_from: from,
          date_to: to,
        },
      });

      setStats(response.data);
    } catch (err) {
      setError("Ошибка загрузки статистики");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedUserId, dateFrom, dateTo]);

  const handleUserChange = (value: string) => {
    setSelectedUserId(value);
  };

  const clearSelection = () => {
    setSelectedUserId("");
    setStats(null);
  };

  const formatNumber = (value: number) => {
    return value ? value.toLocaleString('ru-RU') : '0';
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return value ? `${value.toLocaleString('ru-RU')} ${currency}` : `0 ${currency}`;
  };

  const getSelectedUserLabel = () => {
    if (!selectedUserId) return "Выберите пользователя";
    const user = users.find(u => u.id === selectedUserId);
    return user ? `${user.username} (${user.role})` : "Выберите пользователя";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Статистика пользователя
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selection */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="user-stats-select">Выберите пользователя:</Label>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={handleUserChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={getSelectedUserLabel()} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUserId && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={clearSelection}
                  title="Очистить выбор"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Date Range */}
          <div className="flex gap-2">
            <div>
              <Label>С</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>По</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Загрузка статистики...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* No Selection State */}
        {!selectedUserId && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            Выберите пользователя для просмотра статистики
          </div>
        )}

        {/* Statistics Grid */}
        {stats && selectedUserId && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatNumber(stats.succeed_orders || 0)}</div>
                  <div className="text-xs text-muted-foreground">Успешных сделок</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Обработано заявок</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatNumber(stats.canceled_orders || 0)}</div>
                  <div className="text-xs text-muted-foreground">Отменённых сделок</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Отклонено заявок</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatCurrency(stats.processed_amount_crypto || 0, 'USD')}</div>
                  <div className="text-xs text-muted-foreground">Сумма в крипте (обработано)</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Успешные заявки</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatCurrency(stats.processed_amount_fiat || 0, '₽')}</div>
                  <div className="text-xs text-muted-foreground">Сумма в фиате (обработано)</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Успешные заявки</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatCurrency(stats.canceled_amount_crypto || 0, 'USD')}</div>
                  <div className="text-xs text-muted-foreground">Сумма в крипте (отмена)</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Отклонённые заявки</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatCurrency(stats.canceled_amount_fiat || 0, '₽')}</div>
                  <div className="text-xs text-muted-foreground">Сумма в фиате (отмена)</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Отклонённые заявки</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    +{formatCurrency(stats.income_crypto || 0, 'USD')}
                  </div>
                  <div className="text-xs text-muted-foreground">Прибыль в крипте</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">Чистая прибыль</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{formatNumber(stats.total_orders || 0)}</div>
                  <div className="text-xs text-muted-foreground">Всего сделок</div>
                  <div className="text-lg font-semibold text-muted-foreground">—</div>
                  <div className="text-xs text-muted-foreground">За период</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}