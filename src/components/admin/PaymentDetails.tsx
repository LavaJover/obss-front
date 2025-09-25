// tabs/PaymentDetailsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ChevronLeft, ChevronRight, Loader2, Copy, X } from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentDetailsTab() {
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [traders, setTraders] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    trader_id: '',
    bank_code: '',
    enabled: '',
    payment_system: '',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    items_per_page: 10,
    total_items: 0,
    total_pages: 0
  });

  // Загрузка трейдеров и тимлидов
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const [tradersResponse, teamLeadsResponse] = await Promise.all([
        apiClient.get('/admin/users?role=TRADER'),
        apiClient.get('/admin/users?role=TEAM_LEAD')
      ]);
      
      const allUsers = [
        ...(tradersResponse.data.users || []),
        ...(teamLeadsResponse.data.users || [])
      ];
      
      setTraders(allUsers);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      toast({
        title: "Ошибка загрузки пользователей",
        description: "Не удалось загрузить список трейдеров и тимлидов",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Загрузка банков
  const fetchBanks = async () => {
    try {
      setBanksLoading(true);
      const response = await apiClient.get('/merchant/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке банков:', error);
      toast({
        title: "Ошибка загрузки банков",
        description: "Не удалось загрузить список банков",
        variant: "destructive",
      });
    } finally {
      setBanksLoading(false);
    }
  };

  // Загрузка реквизитов
  const fetchRequisites = async () => {
    setLoading(true);
    try {
      // Формируем параметры запроса, исключая пустые значения
      const params: any = {};
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] !== '' && filters[key as keyof typeof filters] !== null) {
          params[key] = filters[key as keyof typeof filters];
        }
      });

      const response = await apiClient.get('/banking/requisites', { params });
      setBankDetails(response.data.bank_details || []);
      setPagination(response.data.pagination || {
        current_page: 1,
        items_per_page: 10,
        total_items: 0,
        total_pages: 0
      });
    } catch (error) {
      console.error('Ошибка при загрузке реквизитов:', error);
      toast({
        title: "Ошибка загрузки реквизитов",
        description: "Не удалось загрузить банковские реквизиты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchRequisites();
  }, [filters]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Сброс на первую страницу при изменении фильтров
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  const formatUUID = (uuid: string) => {
    if (!uuid) return '';
    return `${uuid.substring(0, 8)}...${uuid.substring(uuid.length - 4)}`;
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.substring(0, 1).toUpperCase();
  };

  const clearFilter = (filterName: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: '',
      page: 1
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Управление реквизитами
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Трейдер/Тимлид */}
            <div>
              <Label>Трейдер/Тимлид:</Label>
              <div className="flex gap-1">
                <Select 
                  value={filters.trader_id} 
                  onValueChange={(value) => handleFilterChange('trader_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {traders.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {filters.trader_id && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => clearFilter('trader_id')}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Банк */}
            <div>
              <Label>Банк:</Label>
              <div className="flex gap-1">
                <Select 
                  value={filters.bank_code} 
                  onValueChange={(value) => handleFilterChange('bank_code', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent>
                    {banksLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {banks.map(bank => (
                          <SelectItem key={bank.code} value={bank.code.toString()}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {filters.bank_code && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => clearFilter('bank_code')}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Платежная система */}
            <div>
              <Label>Платежная система:</Label>
              <div className="flex gap-1">
                <Select 
                  value={filters.payment_system} 
                  onValueChange={(value) => handleFilterChange('payment_system', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SBP">SBP</SelectItem>
                    <SelectItem value="C2C">C2C</SelectItem>
                  </SelectContent>
                </Select>
                {filters.payment_system && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => clearFilter('payment_system')}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Статус */}
            <div>
              <Label>Статус:</Label>
              <div className="flex gap-1">
                <Select 
                  value={filters.enabled} 
                  onValueChange={(value) => handleFilterChange('enabled', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включен</SelectItem>
                    <SelectItem value="false">Выключен</SelectItem>
                  </SelectContent>
                </Select>
                {filters.enabled && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => clearFilter('enabled')}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Таблица реквизитов */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Загрузка реквизитов...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Трейдер</TableHead>
                      <TableHead>Банк</TableHead>
                      <TableHead>Ограничения</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {Object.values(filters).some(val => val && val !== '1' && val !== '10') 
                            ? "Реквизиты не найдены по выбранным фильтрам" 
                            : "Реквизиты не найдены"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      bankDetails.map((detail: any) => {
                        const trader = traders.find((t: any) => t.id === detail.trader_id);
                        const bank = banks.find((b: any) => b.code === detail.bank_code);
                        
                        return (
                          <TableRow key={detail.id}>
                            <TableCell className="font-mono text-xs">
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => copyToClipboard(detail.id)}
                                title="Кликните для копирования"
                              >
                                {formatUUID(detail.id)}
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {getInitials(trader?.username || 'Неизвестно')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{trader?.username || 'Неизвестно'}</div>
                                  <div 
                                    className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                                    onClick={() => copyToClipboard(detail.trader_id)}
                                    title="Кликните для копирования"
                                  >
                                    {formatUUID(detail.trader_id)}
                                    <Copy className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{detail.bank_name}</div>
                                <div className="text-sm text-muted-foreground">{detail.owner}</div>
                                {detail.payment_system === 'C2C' ? (
                                  <div className="text-sm text-muted-foreground">
                                    Карта: {detail.card_number}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    Телефон: {detail.phone}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {bank?.name || detail.bank_code}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                <div>Мин: {detail.min_amount} Макс: {detail.max_amount}</div>
                                <div>В день: {detail.max_amount_day} В месяц: {detail.max_amount_month}</div>
                                <div>Одновр. заказов: {detail.max_orders_simultaneosly}</div>
                                <div>Кол-во в день: {detail.max_quantity_day}</div>
                                <div>Кол-во в месяц: {detail.max_quantity_month}</div>
                                <div>Интервал между сделками (мин): {detail.delay / 60}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={detail.enabled ? "default" : "destructive"}>
                                {detail.enabled ? "Включен" : "Выключен"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Пагинация */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Страница {filters.page} из {pagination.total_pages}
                    {pagination.total_items > 0 && (
                      <span> ({pagination.total_items} всего)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= pagination.total_pages}
                    >
                      Вперёд
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}