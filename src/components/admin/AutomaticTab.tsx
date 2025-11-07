import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  Activity, 
  Server, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  List,
  Loader2,
  X
} from "lucide-react";
import { automaticService, AutomaticStats, AutomaticLog, DeviceStatus } from '@/services/automaticService';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import StatsOverview from './automatic/StatsOverview';
import DevicesMonitor from './automatic/DeviceMonitor';
import LogsViewer from './automatic/LogsViewer';
import RecentActivity from './automatic/RecentActivity';

export default function AutomaticTab() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AutomaticStats | null>(null);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<AutomaticLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
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
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedUserId) {
      // Сбрасываем данные если пользователь не выбран
      setStats(null);
      setDevices([]);
      setRecentActivity([]);
      return;
    }

    setLoading(true);
    try {
      // Загружаем общую статистику
      const statsData = await automaticService.getStats(selectedUserId);
      setStats(statsData);

      // Загружаем последнюю активность
      const activityData = await automaticService.getRecentActivity(selectedUserId);
      setRecentActivity(activityData.activities);

      // Загружаем устройства
      const devicesData = await automaticService.getTraderDevicesStatus(selectedUserId);
      setDevices(devicesData.devices || []);

      toast({
        title: "Данные обновлены",
        description: "Информация по автоматике загружена",
      });
    } catch (error) {
      console.error('Error loading automatic data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    loadData();
    
    // Автообновление каждые 30 секунд только если выбран пользователь
    if (selectedUserId) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  const handleRefresh = () => {
    loadData();
  };

  const handleUserChange = (value: string) => {
    setSelectedUserId(value);
  };

  const clearSelection = () => {
    setSelectedUserId("");
    setStats(null);
    setDevices([]);
    setRecentActivity([]);
  };

  const getSelectedUserLabel = () => {
    if (!selectedUserId) return "Выберите пользователя";
    const user = users.find(u => u.id === selectedUserId);
    return user ? `${user.username} (${user.role})` : "Выберите пользователя";
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-green-600" />
            Мониторинг автоматики
          </h2>
          <p className="text-muted-foreground">
            Реал-тайм мониторинг автоматического закрытия сделок
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="user-select">Выберите пользователя:</Label>
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={handleUserChange} disabled={usersLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={usersLoading ? "Загрузка..." : "Выберите пользователя"} />
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
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={loading || !selectedUserId}
              variant="outline"
              size="icon"
              className="mt-6"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Состояние когда пользователь не выбран */}
      {!selectedUserId && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Выберите пользователя для просмотра статистики автоматики</p>
            <p className="text-sm mt-2">
              Будут показаны устройства, логи обработки SMS и статистика автоматического закрытия сделок
            </p>
          </CardContent>
        </Card>
      )}

      {/* Основные табы (показываем только если выбран пользователь) */}
      {selectedUserId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Устройства
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Логи
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Активность
            </TabsTrigger>
          </TabsList>

          {/* Обзор */}
          <TabsContent value="overview" className="space-y-6">
            <StatsOverview 
              stats={stats} 
              loading={loading}
              traderFilter={selectedUserId}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity 
                activities={recentActivity}
                loading={loading}
              />
              
              <DevicesMonitor 
                devices={devices}
                loading={loading}
                traderFilter={selectedUserId}
              />
            </div>
          </TabsContent>

          {/* Устройства */}
          <TabsContent value="devices">
            <DevicesMonitor 
              devices={devices}
              loading={loading}
              traderFilter={selectedUserId}
              detailed={true}
            />
          </TabsContent>

          {/* Логи */}
          <TabsContent value="logs">
            <LogsViewer 
              traderFilter={selectedUserId}
            />
          </TabsContent>

          {/* Активность */}
          <TabsContent value="activity">
            <RecentActivity 
              activities={recentActivity}
              loading={loading}
              detailed={true}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}