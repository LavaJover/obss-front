import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutomaticStats } from '@/services/automaticService';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  TrendingUp,
  Zap,
  Loader2
} from "lucide-react";

interface StatsOverviewProps {
  stats: AutomaticStats | null;
  loading: boolean;
  traderFilter: string;
}

export default function StatsOverview({ stats, loading, traderFilter }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Загрузка статистики...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overview = stats.overview;

  const statCards = [
    {
      title: "Всего попыток",
      value: overview.total_attempts,
      icon: Zap,
      description: "Обработано SMS",
      color: "text-blue-600"
    },
    {
      title: "Успешных",
      value: overview.successful_attempts,
      icon: CheckCircle2,
      description: `${overview.success_rate?.toFixed(1) || 0}% успеха`,
      color: "text-green-600"
    },
    {
      title: "Закрыто сделок",
      value: overview.approved_orders,
      icon: TrendingUp,
      description: "Автоматически",
      color: "text-emerald-600"
    },
    {
      title: "Среднее время",
      value: `${overview.avg_processing_time_ms || 0}ms`,
      icon: Clock,
      description: "Обработки",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Не найдено сделок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold">{overview.not_found_count || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ошибки обработки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold">{overview.failed_count || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Период анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold">{stats.period_days} дней</span>
            </div>
            {stats.trader_id && (
              <Badge variant="secondary" className="mt-2">
                Трейдер: {stats.trader_id}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}