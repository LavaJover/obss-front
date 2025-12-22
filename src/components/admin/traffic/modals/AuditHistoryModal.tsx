import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Unlock, Clock, User as UserIcon } from "lucide-react";
import { AuditLog, UnlockHistoryItem, User } from "../types";

interface AuditHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderId: string;
  logs: AuditLog[];
  unlocks: UnlockHistoryItem[];
  traders: User[];
}

export default function AuditHistoryModal({
  open,
  onOpenChange,
  traderId,
  logs,
  unlocks,
  traders
}: AuditHistoryModalProps) {
  const trader = traders.find(t => t.id === traderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История проверок трейдера {trader?.username ? `(${trader.username})` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="checks" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checks">
              Проверки антифрода ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="unlocks">
              Ручные разблокировки ({unlocks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checks" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет истории проверок для этого трейдера
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {new Date(log.checked_at).toLocaleString('ru-RU')}
                    </span>
                    <Badge variant={log.all_passed ? "default" : "destructive"}>
                      {log.all_passed ? "Пройдено" : "Провалено"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {log.results.map((result, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start justify-between border-l-2 pl-3 py-1" 
                        style={{borderColor: result.passed ? '#22c55e' : '#ef4444'}}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{result.rule_name}</p>
                          <p className="text-xs text-muted-foreground">{result.message}</p>
                        </div>
                        <Badge variant={result.passed ? "default" : "destructive"} className="text-xs ml-2">
                          {result.passed ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="unlocks" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {unlocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Unlock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Этот трейдер ещё не разблокировался вручную</p>
              </div>
            ) : (
              unlocks.map((unlock) => {
                const admin = traders.find(t => t.id === unlock.admin_id);
                
                return (
                  <Card key={unlock.id} className="p-4 border-l-4 border-orange-500">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Unlock className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ручная разблокировка</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(unlock.unlocked_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {unlock.grace_period_hours}ч
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Администратор</p>
                          <p className="font-medium">{admin?.username || unlock.admin_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Грейс-период</p>
                          <p className="font-medium">{unlock.grace_period_hours} часов</p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Причина разблокировки:</p>
                        <p className="text-sm">{unlock.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Создано: {new Date(unlock.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}