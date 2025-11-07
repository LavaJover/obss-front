import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutomaticLog } from '@/services/automaticService';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Search,
  Clock,
  AlertCircle
} from "lucide-react";

interface RecentActivityProps {
  activities: AutomaticLog[];
  loading: boolean;
  detailed?: boolean;
}

export default function RecentActivity({ activities, loading, detailed = false }: RecentActivityProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Только что";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} мин назад`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} ч назад`;

    return date.toLocaleString("ru-RU", {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (success: boolean, action: string) => {
    if (success) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (action === 'not_found') return <Search className="h-4 w-4 text-amber-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = (success: boolean, action: string) => {
    if (success) return 'Успешно';
    if (action === 'not_found') return 'Не найдено';
    if (action === 'search_error') return 'Ошибка поиска';
    return 'Ошибка';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Последняя активность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Последняя активность
          </CardTitle>
          <CardDescription>
            Нет данных о последней активности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Активность не найдена</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedActivities = detailed ? activities : activities.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Последняя активность
          {!detailed && (
            <Badge variant="secondary">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {detailed ? 'Все последние действия' : 'Последние действия'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(activity.success, activity.action)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">
                    {activity.amount} ₽
                  </p>
                  <Badge 
                    variant={activity.success ? "default" : "secondary"}
                    className={
                      activity.success 
                        ? "bg-green-600" 
                        : activity.action === 'not_found' 
                          ? "bg-amber-600" 
                          : "bg-red-600"
                    }
                  >
                    {getStatusText(activity.success, activity.action)}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    {activity.payment_system} • {activity.device_id}
                  </p>
                  {activity.order_id && (
                    <p className="truncate">
                      Сделка: {activity.order_id}
                    </p>
                  )}
                  {activity.error_message && (
                    <p className="text-red-600 truncate">
                      {activity.error_message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(activity.created_at)}
              </div>
            </div>
          ))}
        </div>

        {!detailed && activities.length > 8 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              и еще {activities.length - 8} действий...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}