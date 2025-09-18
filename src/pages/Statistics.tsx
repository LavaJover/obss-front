import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { RubleIcon } from "@/components/icons/RubleIcon";
import apiClient from "@/lib/api-client";

interface StatisticsData {
  succeed_orders: number;
  canceled_orders: number;
  processed_amount_crypto: number;
  processed_amount_fiat: number;
  canceled_amount_crypto: number;
  canceled_amount_fiat: number;
  income_crypto: number;
  total_orders: number;
}

export default function Statistics() {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Преобразуем даты в объекты Date с правильным временем
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      const response = await apiClient.get("/orders/statistics", {
        params: {
          date_from: fromDate.toISOString(),
          date_to: toDate.toISOString(),
        },
      });

      setStats(response.data);
    } catch (err) {
      setError("Ошибка загрузки статистики");
      console.error("Statistics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const setQuickFilter = (type: "day" | "week" | "month") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case "day":
        const todayStr = today.toISOString().split('T')[0];
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setDateFrom(monthAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    variant = "default" 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: any; 
    variant?: "default" | "success" | "warning" | "destructive";
  }) => {
    const variantStyles = {
      default: "bg-gradient-to-br from-muted/50 to-background border-border/50 shadow-lg",
      success: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg dark:from-emerald-950/20 dark:to-green-950/10 dark:border-emerald-800/30",
      warning: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg dark:from-amber-950/20 dark:to-yellow-950/10 dark:border-amber-800/30",
      destructive: "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg dark:from-red-950/20 dark:to-rose-950/10 dark:border-red-800/30"
    };

    const iconStyles = {
      default: "text-primary/70",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      destructive: "text-red-600 dark:text-red-400"
    };

    return (
      <Card className={variantStyles[variant]}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <Icon className={`h-8 w-8 ${iconStyles[variant]}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Статистика</h1>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Период анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Filter Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickFilter("day")}
              >
                За день
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickFilter("week")}
              >
                За неделю
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickFilter("month")}
              >
                За месяц
              </Button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">С</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">По</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={fetchStatistics}
                disabled={loading}
              >
                {loading ? "Загрузка..." : "Применить фильтр"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/15 text-destructive rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Success Statistics - Green Theme */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Успешных сделок"
          value={stats?.succeed_orders || 0}
          subtitle="Обработано заявок"
          icon={TrendingUp}
          variant="success"
        />
        
        <StatCard
          title="Сумма в крипте (обработано)"
          value={`${stats?.processed_amount_crypto || 0} USD`}
          subtitle="Успешные заявки"
          icon={DollarSign}
          variant="success"
        />
        
        <StatCard
          title="Сумма в фиате (обработано)"
          value={`${stats?.processed_amount_fiat || 0} ₽`}
          subtitle="Успешные заявки"
          icon={RubleIcon}
          variant="success"
        />
        
        <StatCard
          title="Прибыль в крипте"
          value={`${stats?.income_crypto || 0} USD`}
          subtitle="Чистая прибыль"
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Failed Statistics - Red Theme & Other */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Отменённых сделок"
          value={stats?.canceled_orders || 0}
          subtitle="Отклонено заявок"
          icon={TrendingDown}
          variant="destructive"
        />
        
        <StatCard
          title="Сумма в крипте (отмена)"
          value={`${stats?.canceled_amount_crypto || 0} USD`}
          subtitle="Отклонённые заявки"
          icon={DollarSign}
          variant="destructive"
        />
        
        <StatCard
          title="Сумма в фиате (отмена)"
          value={`${stats?.canceled_amount_fiat || 0} ₽`}
          subtitle="Отклонённые заявки"
          icon={RubleIcon}
          variant="destructive"
        />
        
        <StatCard
          title="Всего сделок"
          value={stats?.total_orders || 0}
          subtitle="За период"
          icon={Activity}
          variant="default"
        />
      </div>
    </div>
  );
}