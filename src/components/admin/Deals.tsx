// tabs/DealsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Handshake, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function DealsTab() {
  // Pagination state for deals
  const [dealsCurrentPage, setDealsCurrentPage] = useState(1);
  const dealsPerPage = 10;
  
  // Dispute dialog state
  const [openDisputeDialog, setOpenDisputeDialog] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    amount: "",
    reason: "неизвестная причина",
    timeInMinutes: ""
  });

  // Mock data for deals
  const allDeals = [
    {
      id: "0e33...2294",
      bankDetails: {
        bank: "Т-Банк",
        code: "-",
        paymentSystem: "SBP",
        owner: "Магомед Темирбекович",
        requisites: "+79696650172"
      },
      amount: {
        rub: 15042,
        crypto: 178.075056,
        rate: 84.47
      },
      merchant: {
        name: "biwire_finance",
        id: "4558...8109"
      },
      merchantOrderId: "5f8c9774-7023-486b-ad34-2d56a4e10318",
      trader: {
        name: "Lightning's23",
        id: "f506...d788"
      },
      created: {
        utc: "12.09 16:47",
        local: "12.09 19:47"
      },
      updated: {
        utc: "12.09 16:47",
        local: "12.09 19:47"
      },
      timer: "6м 6с",
      status: "PENDING",
      action: "24fc...5e33"
    },
    // Add more mock deals to demonstrate pagination
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `deal-${i + 2}`,
      bankDetails: {
        bank: i % 3 === 0 ? "Т-Банк" : i % 3 === 1 ? "Сбербанк" : "Альфа-Банк",
        code: "-",
        paymentSystem: i % 2 === 0 ? "SBP" : "CARD",
        owner: `Владелец ${i + 2}`,
        requisites: `+7912345${String(i).padStart(4, '0')}`
      },
      amount: {
        rub: 10000 + i * 500,
        crypto: 100 + i * 5,
        rate: 84 + i * 0.1
      },
      merchant: {
        name: i % 2 === 0 ? "biwire_finance" : "crypto_exchange",
        id: `merchant-${i + 2}`
      },
      merchantOrderId: `order-${i + 2}`,
      trader: {
        name: i % 3 === 0 ? "Lightning's23" : i % 3 === 1 ? "Puldorovich" : "john_trader",
        id: `trader-${i + 2}`
      },
      created: {
        utc: "12.09 16:47",
        local: "12.09 19:47"
      },
      updated: {
        utc: "12.09 16:47",
        local: "12.09 19:47"
      },
      timer: `${i + 1}м ${(i * 10) % 60}с`,
      status: i % 3 === 0 ? "PENDING" : i % 3 === 1 ? "COMPLETED" : "CANCELLED",
      action: `action-${i + 2}`
    }))
  ];

  // Calculate deals pagination
  const totalDeals = allDeals.length;
  const totalDealsPages = Math.ceil(totalDeals / dealsPerPage);
  const dealsStartIndex = (dealsCurrentPage - 1) * dealsPerPage;
  const dealsEndIndex = dealsStartIndex + dealsPerPage;
  const currentDeals = allDeals.slice(dealsStartIndex, dealsEndIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="h-5 w-5" />
          Управление сделками
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 border rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Трейдер</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все трейдеры</option>
              <option value="lightning">Lightning's23</option>
              <option value="puldorovich">Puldorovich</option>
              <option value="john">john_trader</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Мерчант</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все мерчанты</option>
              <option value="biwire">biwire_finance</option>
              <option value="crypto">crypto_exchange</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Статус</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все статусы</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Тип сделки</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все типы</option>
              <option value="BUY">Покупка</option>
              <option value="SELL">Продажа</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID сделки</label>
            <input
              type="text"
              placeholder="Поиск по ID"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID заказа мерчанта</label>
            <input
              type="text"
              placeholder="Merchant Order ID"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Банк</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все банки</option>
              <option value="tbank">Т-Банк</option>
              <option value="sber">Сбербанк</option>
              <option value="alfa">Альфа-Банк</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID устройства</label>
            <input
              type="text"
              placeholder="Device ID"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Платежная система</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Все системы</option>
                <option value="SBP">SBP</option>
                <option value="CARD">Карта</option>
                <option value="QIWI">QIWI</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Сумма от</label>
              <input
                type="text"
                placeholder="Мин. сумма (₽)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Сумма до</label>
              <input
                type="text"
                placeholder="Макс. сумма (₽)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Дата от</label>
              <input
                type="text"
                placeholder="дд.мм.гггг"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Дата до</label>
              <input
                type="text"
                placeholder="дд.мм.гггг"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Записей на странице</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">&nbsp;</label>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                Сбросить
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Всего сделок: {totalDeals}</span>
            <span>Страница: {dealsCurrentPage} из {totalDealsPages}</span>
          </div>

          {/* Deals Table */}
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID сделки</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Реквизиты</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Сумма</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Мерчант</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Merchant Order ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Трейдер</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Создана</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Обновлена</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Таймер</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Статус</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {currentDeals.map((deal) => (
                  <tr key={deal.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="text-xs">
                        <div className="font-mono">{deal.id}⎘</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">Банк:</span> {deal.bankDetails.bank}</div>
                        <div><span className="font-medium">Код:</span> {deal.bankDetails.code}</div>
                        <div><span className="font-medium">ПС:</span> {deal.bankDetails.paymentSystem}</div>
                        <div><span className="font-medium">Владелец:</span> {deal.bankDetails.owner}</div>
                        <div><span className="font-medium">Реквизиты:</span> {deal.bankDetails.requisites}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">Рубли:</span> {deal.amount.rub} ₽</div>
                        <div><span className="font-medium">Крипто:</span> {deal.amount.crypto} USD</div>
                        <div><span className="font-medium">Курс:</span> {deal.amount.rate}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs">
                        <div>{deal.merchant.name}</div>
                        <div className="font-mono">{deal.merchant.id}⎘</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs font-mono">{deal.merchantOrderId}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs">
                        <div>{deal.trader.name}</div>
                        <div className="font-mono">{deal.trader.id}⎘</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">UTC:</span> {deal.created.utc}</div>
                        <div><span className="font-medium">Лок:</span> {deal.created.local}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">UTC:</span> {deal.updated.utc}</div>
                        <div><span className="font-medium">Лок:</span> {deal.updated.local}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs">{deal.timer}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        deal.status === "PENDING" 
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          : deal.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {deal.status === "COMPLETED" ? (
                        <Dialog open={openDisputeDialog} onOpenChange={setOpenDisputeDialog}>
                          <DialogTrigger asChild>
                            <button 
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 text-xs"
                              onClick={() => {
                                setDisputeForm({
                                  amount: deal.amount.rub.toString(),
                                  reason: "неизвестная причина",
                                  timeInMinutes: ""
                                });
                              }}
                            >
                              Открыть диспут
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Открыть диспут</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="dispute-amount">Сумма диспута</Label>
                                <Input
                                  id="dispute-amount"
                                  type="number"
                                  value={disputeForm.amount}
                                  onChange={(e) => setDisputeForm({...disputeForm, amount: e.target.value})}
                                  placeholder="Введите сумму"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dispute-reason">Причина диспута</Label>
                                <Select value={disputeForm.reason} onValueChange={(value) => setDisputeForm({...disputeForm, reason: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="неверная сумма">неверная сумма</SelectItem>
                                    <SelectItem value="нет оплаты">нет оплаты</SelectItem>
                                    <SelectItem value="неизвестная причина">неизвестная причина</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dispute-time">Время диспута (в минутах)</Label>
                                <Input
                                  id="dispute-time"
                                  type="number"
                                  value={disputeForm.timeInMinutes}
                                  onChange={(e) => setDisputeForm({...disputeForm, timeInMinutes: e.target.value})}
                                  placeholder="Введите время в минутах"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setOpenDisputeDialog(false)}>
                                Отмена
                              </Button>
                              <Button onClick={() => {
                                console.log("Открытие диспута:", disputeForm);
                                setOpenDisputeDialog(false);
                              }}>
                                Открыть диспут
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="text-xs font-mono">{deal.action}⎘</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deals Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Показано {dealsStartIndex + 1}-{Math.min(dealsEndIndex, totalDeals)} из {totalDeals} сделок
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDealsCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={dealsCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalDealsPages) }, (_, i) => {
                  let pageNum;
                  if (totalDealsPages <= 5) {
                    pageNum = i + 1;
                  } else if (dealsCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (dealsCurrentPage >= totalDealsPages - 2) {
                    pageNum = totalDealsPages - 4 + i;
                  } else {
                    pageNum = dealsCurrentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={dealsCurrentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDealsCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDealsCurrentPage(prev => Math.min(prev + 1, totalDealsPages))}
                disabled={dealsCurrentPage === totalDealsPages}
              >
                Вперёд
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }