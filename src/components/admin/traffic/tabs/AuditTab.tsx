import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { History } from "lucide-react";
import { AuditLog, User } from "../types";

interface AuditTabProps {
  auditLogs: AuditLog[];
  traders: User[];
}

export default function AuditTab({
  auditLogs,
  traders
}: AuditTabProps) {
  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет истории проверок
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          История проверок
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Трейдер</TableHead>
              <TableHead>Дата проверки</TableHead>
              <TableHead>Результат</TableHead>
              <TableHead>Детали</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => {
              const trader = traders.find(t => t.id === log.trader_id);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    {trader ? (
                      <div className="space-y-1">
                        <div className="font-medium">{trader.username}</div>
                        <div className="text-sm text-muted-foreground">@{trader.login}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">{log.trader_id}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(log.checked_at).toLocaleString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.all_passed ? "default" : "destructive"}>
                      {log.all_passed ? "Пройдено" : "Провалено"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          Посмотреть
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96">
                        <div className="space-y-2">
                          {log.results.map((result, idx) => (
                            <div key={idx} className="border-b pb-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{result.rule_name}</span>
                                <Badge variant={result.passed ? "default" : "destructive"} className="text-xs">
                                  {result.passed ? "✓" : "✗"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}