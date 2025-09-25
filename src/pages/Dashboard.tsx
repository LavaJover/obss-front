import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { walletService } from "@/services/walletService";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

export default function Dashboard() {
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [balance, setBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [teamName, setTeamName] = useState("Alpha"); // По умолчанию Alpha
  const [loading, setLoading] = useState(true);
  const { userID, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!userID) return;
      
      try {
        // Параллельно загружаем баланс и данные пользователя
        const [balanceData, userData] = await Promise.all([
          walletService.getWalletBalance(userID),
          apiClient.get(`/users/${userID}`) // Запрос данных пользователя
        ]);
        
        setBalance(balanceData.balance);
        setFrozenBalance(balanceData.frozen);
        
        // Устанавливаем логин как название команды
        if (userData.data && userData.data.login) {
          setTeamName(userData.data.login);
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
          toast({
            title: "Ошибка загрузки данных",
            description: "Не удалось загрузить данные кошелька",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userID, logout, navigate, toast]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Основной баланс</p>
              <p className="text-xl font-bold text-primary">{balance.toFixed(2)} USDT</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">В заморозке</p>
              <p className="text-xl font-bold text-muted-foreground">{frozenBalance.toFixed(2)} USDT</p>
            </div>
          </div>
          {/* <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Статус трафика</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trafficEnabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {trafficEnabled ? "Активен" : "Неактивен"}
              </div>
            </div>
            <Switch checked={trafficEnabled} onCheckedChange={setTrafficEnabled} />
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}