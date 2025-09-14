import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
export default function Dashboard() {
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const teamName = "Команда Alpha";
  const balance = "2,133.5";
  const insuranceDeposit = "1,000";
  const frozenBalance = "0";
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <h1 className="text-3xl font-bold text-foreground">Главная</h1> */}
        <Badge variant="secondary" className="text-sm">
          {teamName}
        </Badge>
      </div>

      {/* Balance Overview */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          {/* <CardTitle className="text-lg font-semibold">Обзор баланса</CardTitle> */}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Основной баланс</p>
              <p className="text-xl font-bold text-primary">{balance} USDT</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">В заморозке</p>
              <p className="text-xl font-bold text-muted-foreground">{frozenBalance} USDT</p>
            </div>
            {/* <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Страховой депозит</p>
              <p className="text-xl font-bold text-secondary">{insuranceDeposit} USDT</p>
            </div> */}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Статус трафика</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trafficEnabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {trafficEnabled ? "Активен" : "Неактивен"}
              </div>
            </div> */}
            {/* <Switch checked={trafficEnabled} onCheckedChange={setTrafficEnabled} /> */}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      
    </div>;
}