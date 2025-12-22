import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Unlock, Clock, History, Settings, Trash2 } from "lucide-react";
import { TraderTraffic, User } from "../types";

interface TradersSectionProps {
  traders: TraderTraffic[];
  actionLoading: string | null;
  renderUserInfo: (user: User) => JSX.Element;
  onOpenTraderSettings: (trader: TraderTraffic) => void;
  onCheckTrader: (traderId: string) => void;
  onViewAuditHistory: (traderId: string) => void;
  onManualUnlock: (trader: TraderTraffic) => void;
  onDeleteTrader: (trader: TraderTraffic) => void;
  checkingTrader: string | null;
}

export default function TradersSection({
  traders,
  actionLoading,
  renderUserInfo,
  onOpenTraderSettings,
  onCheckTrader,
  onViewAuditHistory,
  onManualUnlock,
  onDeleteTrader,
  checkingTrader
}: TradersSectionProps) {
  if (traders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет трейдеров для отображения
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Трейдер</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Параметры</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {traders.map((trader) => {
          const firstConnection = trader.connections[0];
          return (
            <TableRow key={trader.trader.id}>
              <TableCell>{renderUserInfo(trader.trader)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={trader.trader_unlocked ? "default" : "secondary"}>
                    {trader.trader_unlocked ? "Разблокирован" : "Заблокирован"}
                  </Badge>
                  {trader.grace_period_until && new Date(trader.grace_period_until) > new Date() && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Грейс-период
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {firstConnection && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Трейдер:</Label>
                        <Badge 
                          variant={firstConnection.activity_params.trader_unlocked ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {firstConnection.activity_params.trader_unlocked ? (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Вкл
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Выкл
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Антифрод:</Label>
                        <Badge 
                          variant={firstConnection.activity_params.antifraud_unlocked ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {firstConnection.activity_params.antifraud_unlocked ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Разблок
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Заблок
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCheckTrader(trader.trader.id)}
                    disabled={checkingTrader === trader.trader.id}
                    title="Проверить антифродом"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAuditHistory(trader.trader.id)}
                    title="История проверок"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManualUnlock(trader)}
                    title="Ручная разблокировка"
                    disabled={trader.trader_unlocked}
                    className={!trader.trader_unlocked ? "border-orange-500 text-orange-500 hover:bg-orange-50" : ""}
                  >
                    <Unlock className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTraderSettings(trader)}
                    disabled={actionLoading !== null}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteTrader(trader)}
                    disabled={actionLoading !== null}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}