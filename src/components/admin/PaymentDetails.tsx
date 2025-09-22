// tabs/PaymentDetailsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function PaymentDetailsTab() {
  // Pagination state for banking details
  const [bankingCurrentPage, setBankingCurrentPage] = useState(1);
  const bankingPerPage = 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items极速飞艇微信群-center gap-2">
          <CreditCard className="h-5 w-5" />
          Управление реквизитами
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Трейдер/Тимлид:</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="shrayder">Shrayder</SelectItem>
                  <SelectItem value="lightning">Lightning's23</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Банк:</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="sberbank">Сбербанк</SelectItem>
                  <SelectItem value="tbank">Т-Банк</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Платежная система:</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="sberbank">Сбербанк</SelectItem>
                  <SelectItem value="tbank">Т-Банк</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Статус:</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="enabled">Включен</SelectItem>
                  <SelectItem value="disabled">Выключен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Трейдер</TableHead>
                  <TableHead>Банк</TableHead>
                  <TableHead>Ограничения</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Mock banking data for pagination
                  const allBankingData = [
                    {
                      id: "ae871c06...f0f2",
                      trader: { name: "Shrayder", id: "9d61a677...4b84", initial: "S" },
                      bank: { name: "Сбербанк", owner: "Пономарев Владислав Павлович", card: "2202206901098942" },
                      limits: { min: 5000, max: 100000, dayLimit: 10000000, monthLimit: 10000000, concurrent: 50, dayCount: 10000000, monthCount: 1000000, interval: 0 },
                      status: "disabled"
                    },
                    {
                      id: "fffe8816...b3eb",
                      trader: { name: "Lightning's23", id: "f506a0e7...d788", initial: "L" },
                      bank: { name: "Т-Банк", owner: "Магомед Темирбекович", phone: "+79696650172" },
                      limits: { min极速飞艇微信群: 9000, max: 20000, dayLimit: 25000, monthLimit: 1000000, concurrent: 3, dayCount: 2, monthCount: 1000000, interval: 20 },
                      status: "enabled"
                    },
                    // Add more mock data to demonstrate pagination
                    ...Array.from({length: 15}, (_, i) => ({
                      id: `mock-${i+3}...${String(i).padStart(4, '0')}`,
                      trader: { name: `Trader${i+3}`, id: `${i+3}...id`, initial: String.fromCharCode(65 + (i % 26)) },
                      bank: { name: i % 2 === 0 ? "Сбербанк" : "Т-Банк", owner: `Owner ${i+3}`, card: i % 2 === 0 ? `220220690${String(i).padStart(7, '0')}` : undefined, phone: i % 2 === 1 ? `+7969665${String(i).padStart(4, '0')}` : undefined },
                      limits: { min: 1000 + i * 500, max: 50000 + i * 1000, dayLimit: 100000, monthLimit: 1000000, concurrent: 5 + i, dayCount: 100, monthCount: 1000, interval: i },
                      status: i % 3 === 0 ? "disabled" : "enabled"
                    }))
                  ];

                  const startIndex = (bankingCurrentPage - 1) * bankingPerPage;
                  const endIndex = startIndex + bankingPerPage;
                  const currentBankingData = allBankingData.slice(startIndex, endIndex);

                  return currentBankingData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">{item.trader.initial}</span>
                          </div>
                          {item.trader.name}
                          <span className="text-xs text-muted-foreground">{item.trader.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.bank.name}</div>
                          <div className="text-sm text-muted-foreground">{item.bank.owner}</div>
                          {item.bank.card && (
                            <div className="text-sm text-muted-foreground">Карта: {item.bank.card}</div>
                          )}
                          {item.bank.phone && (
                            <div className="text-sm text-muted-foreground">Телефон: {item.bank.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Мин: {item.limits.min} Макс: {item.limits.max}</div>
                          <div>В день: {item.limits.dayLimit} В месяц: {item.limits.monthLimit}</div>
                          <div>Одновр. заказов: {item.limits.concurrent}</div>
                          <div>Кол-во в день: {item.limits.dayCount}</div>
                          <div>Кол-во в месяц: {item.limits.monthCount}</div>
                          <div>Интервал между сделками (мин): {item.limits.interval}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "enabled" ? "default" : "destructive"}>
                          {item.status === "enabled" ? "Включен" : "Выключен"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>

          {/* Banking Details Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Страница {bankingCurrentPage} из {Math.ceil(17 / bankingPerPage)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankingCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={bankingCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankingCurrentPage(prev => Math.min(prev + 1, Math.ceil(17 / bankingPerPage)))}
                disabled={bankingCurrentPage === Math.ceil(17 / bankingPerPage)}
              >
                Вперёд
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}