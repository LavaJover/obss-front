import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { automaticService, AutomaticLog } from '@/services/automaticService';
import { toast } from '@/hooks/use-toast';

interface LogsViewerProps {
  traderFilter: string;
}

export default function LogsViewer({ traderFilter }: LogsViewerProps) {
  const [logs, setLogs] = useState<AutomaticLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    device_id: '',
    action: '',
    success: '',
    limit: 50,
    offset: 0
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: filters.limit,
        offset: filters.offset
      };

      if (traderFilter) params.trader_id = traderFilter;
      if (filters.device_id) params.device_id = filters.device_id;
      if (filters.action) params.action = filters.action;
      if (filters.success !== '') params.success = filters.success === 'true';

      const response = await automaticService.getLogs(params);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить логи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.offset, traderFilter]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePrevPage = () => {
    if (filters.offset > 0) {
      setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  const handleNextPage = () => {
    if (filters.offset + filters.limit < total) {
      setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const getStatusIcon = (success: boolean, action: string) => {
    if (success) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (action === 'not_found') return <Search className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = (success: boolean, action: string) => {
    if (success) return 'Успешно';
    if (action === 'not_found') return 'Не найдено';
    if (action === 'search_error') return 'Ошибка поиска';
    return 'Ошибка';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ru-RU');
  };

  // const handleExport = async () => {
  //   try {
  //     const blob = await automaticService.exportLogs({
  //       trader_id: traderFilter,
  //       device_id: filters.device_id,
  //       action: filters.action,
  //       success: filters.success !== '' ? filters.success === 'true' : undefined
  //     });
      
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.style.display = 'none';
  //     a.href = url;
  //     a.download = `automatic-logs-${new Date().toISOString().split('T')[0]}.csv`;
  //     document.body.appendChild(a);
  //     a.click();
  //     window.URL.revokeObjectURL(url);
      
  //     toast({
  //       title: "Экспорт завершен",
  //       description: "Логи успешно экспортированы в CSV",
  //     });
  //   } catch (error) {
  //     console.error('Export error:', error);
  //     toast({
  //       title: "Ошибка экспорта",
  //       description: "Не удалось экспортировать логи",
  //       variant: "destructive",
  //     });
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Логи автоматики
        </CardTitle>
        <CardDescription>
          Детальная информация о обработке SMS уведомлений
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="device">Устройство</Label>
            <Input
              id="device"
              placeholder="ID устройства..."
              value={filters.device_id}
              onChange={(e) => handleFilterChange('device_id', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="action">Действие</Label>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Все действия" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Одобрено</SelectItem>
                <SelectItem value="not_found">Не найдено</SelectItem>
                <SelectItem value="failed">Ошибка</SelectItem>
                <SelectItem value="search_error">Ошибка поиска</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="success">Статус</Label>
            <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Успешно</SelectItem>
                <SelectItem value="false">Ошибка</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadLogs} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Поиск
            </Button>
            <Button 
              variant="outline" 
              // onClick={handleExport}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Таблица логов */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/6"></div>
                <div className="h-4 bg-muted rounded w-1/6"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Логи не найдены</p>
            <p className="text-sm">Попробуйте изменить параметры фильтрации</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.success, log.action)}
                      <div>
                        <p className="font-medium">
                          {log.amount} ₽ • {log.payment_system}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Устройство: {log.device_id} | Трейдер: {log.trader_id}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.success ? "default" : "secondary"}>
                      {getStatusText(log.success, log.action)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Действие:</span> {log.action}
                    </div>
                    <div>
                      <span className="font-medium">Найдено сделок:</span> {log.orders_found}
                    </div>
                    <div>
                      <span className="font-medium">Время обработки:</span> {log.processing_time}ms
                    </div>
                  </div>

                  {log.order_id && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Сделка:</span>
                      <Badge variant="outline" className="ml-2">
                        {log.order_id}
                      </Badge>
                    </div>
                  )}

                  {log.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="font-medium">Ошибка:</span> {log.error_message}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Получено: {formatDate(log.received_at)}</span>
                      <span>Создан: {formatDate(log.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{log.processing_time}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Показано {filters.offset + 1}-{Math.min(filters.offset + filters.limit, total)} из {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={filters.offset + filters.limit >= total}
                >
                  Вперед
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}