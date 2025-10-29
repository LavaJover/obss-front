import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { walletService } from "@/services/walletService";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { Loader2, DollarSign, Lock, Unlock } from "lucide-react";

interface TrafficConnection {
  id: string;
  name: string;
  trader_reward_percent: number;
  activity_params: {
    merchant_unlocked: boolean;
    trader_unlocked: boolean;
  };
}

export default function Dashboard() {
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [balance, setBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [teamName, setTeamName] = useState("Alpha");
  const [loading, setLoading] = useState(true);
  const [trafficConnections, setTrafficConnections] = useState<TrafficConnection[]>([]);
  const [togglingTraffic, setTogglingTraffic] = useState(false);
  
  const { userID, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!userID) return;
      
      try {
        const [balanceData, userData, trafficData] = await Promise.all([
          walletService.getWalletBalance(userID),
          apiClient.get(`/users/${userID}`),
          apiClient.get(`/traffic/traders/${userID}`)
        ]);
        
        setBalance(balanceData.balance);
        setFrozenBalance(balanceData.frozen);
        
        if (userData.data && userData.data.login) {
          setTeamName(userData.data.login);
        }

        // Фильтруем только записи где merchant_unlocked = true
        const activeConnections = (trafficData.data.records || []).filter(
          (record: any) => record.activity_params?.merchant_unlocked
        );
        
        setTrafficConnections(activeConnections);

        // Определяем статус трафика (все ли trader_unlocked)
        if (activeConnections.length > 0) {
          const allEnabled = activeConnections.every(
            (conn: any) => conn.activity_params?.trader_unlocked
          );
          setTrafficEnabled(allEnabled);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
          toast({
            title: "Сессия истекла",
            description: "Пожалуйста, войдите снова",
            variant: "destructive",
          });
        } else {
          console.error("Ошибка загрузки данных:", error);
          toast({
            title: "Ошибка загрузки данных",
            description: "Не удалось загрузить данные",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userID, logout, navigate, toast]);

  const handleTrafficToggle = async (enabled: boolean) => {
    setTogglingTraffic(true);
    try {
      await apiClient.patch(`/traffic/traders/${userID}?unlocked=${enabled}`);
      
      setTrafficEnabled(enabled);
      
      // Обновляем локальное состояние подключений
      setTrafficConnections(prev => 
        prev.map(conn => ({
          ...conn,
          activity_params: {
            ...conn.activity_params,
            trader_unlocked: enabled
          }
        }))
      );
      
      toast({
        title: enabled ? "Трафик включен" : "Трафик отключен",
        description: enabled 
          ? "Вы будете получать новые заказы" 
          : "Новые заказы не будут поступать",
      });
    } catch (error: any) {
      console.error("Ошибка переключения трафика:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус трафика",
        variant: "destructive",
      });
    } finally {
      setTogglingTraffic(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          Аккаунт {teamName}
        </Badge>
      </div>

      {/* Balance Overview */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Обзор баланса</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Основной баланс</p>
              <p className="text-2xl font-bold text-primary">{balance.toFixed(2)} USDT</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">В заморозке</p>
              <p className="text-2xl font-bold text-muted-foreground">{frozenBalance.toFixed(2)} USDT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Управление трафиком</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <p className="font-medium">Статус трафика</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                trafficEnabled 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {trafficEnabled ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Активен
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Неактивен
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {togglingTraffic && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch 
                checked={trafficEnabled} 
                onCheckedChange={handleTrafficToggle}
                disabled={togglingTraffic || trafficConnections.length === 0}
              />
            </div>
          </div>

          {/* Traffic Connections List */}
          {trafficConnections.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Ваши подключения ({trafficConnections.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trafficConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        connection.activity_params.trader_unlocked 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <DollarSign className={`h-4 w-4 ${
                          connection.activity_params.trader_unlocked 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{connection.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Награда: {(connection.trader_reward_percent * 100).toFixed(3)}%
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={connection.activity_params.trader_unlocked ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {connection.activity_params.trader_unlocked ? "Активно" : "Неактивно"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">У вас пока нет активных подключений</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}