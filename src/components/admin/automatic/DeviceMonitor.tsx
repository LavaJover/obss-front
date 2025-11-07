import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeviceStatus } from '@/services/automaticService';
import { 
  Server, 
  Wifi, 
  WifiOff,
  Clock,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface DevicesMonitorProps {
  devices: DeviceStatus[];
  loading: boolean;
  traderFilter: string;
  detailed?: boolean;
}

export default function DevicesMonitor({ devices, loading, traderFilter, detailed = false }: DevicesMonitorProps) {
  const formatLastPing = (timestamp: number) => {
    if (!timestamp) return "Никогда";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Только что";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} мин назад`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} ч назад`;

    return date.toLocaleString("ru-RU");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Мониторинг устройств
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!traderFilter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Мониторинг устройств
          </CardTitle>
          <CardDescription>
            Укажите ID трейдера для просмотра устройств
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Введите ID трейдера в фильтр выше</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Мониторинг устройств
          </CardTitle>
          <CardDescription>
            У трейдера {traderFilter} нет зарегистрированных устройств
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const onlineCount = devices.filter(d => d.online).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Мониторинг устройств
          <Badge variant={onlineCount > 0 ? "default" : "secondary"}>
            {onlineCount} онлайн
          </Badge>
          {offlineCount > 0 && (
            <Badge variant="secondary">
              {offlineCount} оффлайн
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {traderFilter} • Всего устройств: {devices.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-full ${
                  device.online 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {device.online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{device.device_name}</p>
                    <Badge 
                      variant={device.online ? "default" : "secondary"}
                      className={device.online ? "bg-green-600" : ""}
                    >
                      {device.online ? "Онлайн" : "Оффлайн"}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>ID: {device.device_id}</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Последний пинг: {formatLastPing(device.last_ping)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {detailed && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Сводка по устройствам */}
        {detailed && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Сводка по устройствам</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Всего устройств:</span>
                <span className="ml-2 font-medium">{devices.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Онлайн:</span>
                <span className="ml-2 font-medium text-green-600">{onlineCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Оффлайн:</span>
                <span className="ml-2 font-medium text-gray-600">{offlineCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Активность:</span>
                <span className="ml-2 font-medium">
                  {onlineCount > 0 ? 'Нормальная' : 'Нет активности'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}