// tabs/DisputesTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DisputesTab() {
  // Pagination state for disputes
  const [disputesCurrentPage, setDisputesCurrentPage] = useState(1);
  const disputesPerPage = 10;

  // Mock data for disputes (in real app, this would come from API)
  const allDisputes = [
    {
      id: "dfa176c4-29b6-4ffb-ad2a-035c00538892",
      bankDetails: {
        bank: "Т-Банк (SBP)",
        phone: "+79815574742",
        owner: "Бодя",
        trader: "obsthandler"
      },
      dealDetails: {
        orderId: "685a5d8e-fc6d-4f32-9c3e-9d6ba64eaee5",
        merchantOrderId: "trip-prod-test-1",
        amountRub: 2007,
        amountCrypto: 25.342829,
        rate: 79.194
      },
      disputeDetails: {
        reason: "WRONG_AMOUNT",
        status: "Открыт",
        amountRubDispute: 2007,
        amountCryptoDispute: 25.342829,
        autoAccept: "Истекло"
      }
    },
    {
      id: "xyz789ab-29b6-4ffb-ad2a-035c00538123",
      bankDetails: {
        bank: "Сбербанк",
        phone: "+79123456789",
        owner: "Иван Иванов",
        trader: "john_trader"
      },
      dealDetails: {
        orderId: "abc123de-fc6d-4f32-9c3e-9d6ba64eef78",
        merchantOrderId: "crypto-test-2",
        amountRub: 5000,
        amountCrypto: 62.5,
        rate: 80.0
      },
      disputeDetails: {
        reason: "PAYMENT_NOT_RECEIVED",
        status: "Заморожен",
        amountRubDispute: 5000,
        amountCryptoDispute: 62.5,
        autoAccept: "2 дня"
      }
    },
    // Add more mock disputes to demonstrate pagination
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `dispute-${i + 3}`,
      bankDetails: {
        bank: i % 2 === 0 ? "Сбербанк" : "Т-Банк",
        phone: `+7912345${String(i).padStart(4, '0')}`,
        owner: `Владелец ${i + 3}`,
        trader: i % 3 === 0 ? "obsthandler" : i % 3 === 1 ? "john_trader" : "mike_trader"
      },
      dealDetails: {
        orderId: `order-${i + 3}`,
        merchantOrderId: `merchant-${i + 3}`,
        amountRub: 1000 + i * 100,
        amountCrypto: 10 + i,
        rate: 80 + i * 0.1
      },
      disputeDetails: {
        reason: i % 2 === 0 ? "WRONG_AMOUNT" : "PAYMENT_NOT_RECEIVED",
        status: i % 3 === 0 ? "Открыт" : i % 3 === 1 ? "Заморожен" : "Закрыт",
        amountRubDispute: 1000 + i * 100,
        amountCryptoDispute: 10 + i,
        autoAccept: i % 2 === 0 ? "Истекло" : `${i} дней`
      }
    }))
  ];

  // Calculate disputes pagination
  const totalDisputes = allDisputes.length;
  const totalDisputesPages = Math.ceil(totalDisputes / disputesPerPage);
  const disputesStartIndex = (disputesCurrentPage - 1) * disputesPerPage;
  const disputesEndIndex = disputesStartIndex + disputesPerPage;
  const currentDisputes = allDisputes.slice(disputesStartIndex, disputesEndIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Управление диспутами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 border rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Статус</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все статусы</option>
              <option value="open">Открыты</option>
              <option value="accepted">Принят</option>
              <option value="rejected">Отклонён</option>
              <option value="frozen">Заморожен</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Трейдер</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все трейдеры</option>
              <option value="obsthandler">obsthandler</option>
              <option value="john_trader">john_trader</option>
              <option value="mike_trader">mike_trader</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Мерчант</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Все мерчанты</option>
              <option value="merchant1">biwire_finance</option>
              <option value="merchant2">crypto_exchange</option>
              <option value="merchant3">payment_gateway</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID диспута</label>
            <input
              type="text"
              placeholder="Фильтр по ID диспута"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">ID сделки</label>
            <input
              type="text"
              placeholder="Фильтр по ID сделки"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Записей</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <div className="flex justify-start">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Сбросить фильтр
          </button>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {currentDisputes.map((dispute) => (
            <div key={dispute.id} className="border rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Bank Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Банковские реквизиты</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Банк:</span> {dispute.bankDetails.bank}</p>
                    <p><span className="font-medium">Телефон:</span> {dispute.bankDetails.phone}</p>
                    <p><span className="font-medium">Владелец:</span> {dispute.bankDetails.owner}</p>
                    <p><span className="font-medium">Trader:</span> {dispute.bankDetails.trader}</p>
                  </div>
                </div>

                {/* Deal Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Детали сделки</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Order ID:</span> {dispute.dealDetails.orderId}</p>
                    <p><span className="font-medium">Merchant Order ID:</span> {dispute.dealDetails.merchantOrderId}</p>
                    <p><span className="font-medium">Сумма (₽):</span> {dispute.dealDetails.amountRub}</p>
                    <p><span className="font-medium">Сумма (крипто):</span> {dispute.dealDetails.amountCrypto}</p>
                    <p><span className="font-medium">Курс:</span> {dispute.dealDetails.rate}</p>
                  </div>
                </div>

                {/* Dispute Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Детали диспута</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">ID диспута:</span> {dispute.id}</p>
                    <p><span className="font-medium">Причина:</span> {dispute.disputeDetails.reason}</p>
                    <p><span className="font-medium">Статус:</span> 
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ml-2 ${
                        dispute.disputeDetails.status === "Открыт" 
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          : dispute.disputeDetails.status === "Заморожен"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }`}>
                        {dispute.disputeDetails.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Сумма диспута (₽):</span> {dispute.disputeDetails.amountRubDispute}</p>
                    <p><span className="font-medium">Сумма диспута (крипто):</span> {dispute.disputeDetails.amountCryptoDispute}</p>
                    <p><span className="font-medium">Доказательство</span></p>
                    <p><span className="font-medium">До автопринятия:</span> {dispute.disputeDetails.autoAccept}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {dispute.disputeDetails.status === "Открыт" && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-9 px-3">
                          Закрыть
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы точно хотите закрыть диспут?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => console.log('Диспут закрыт')}>
                            Закрыть диспут
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
                          Отменить
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы точно хотите отменить диспут?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => console.log('Диспут отменен')}>
                            Отменить диспут
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 h-9 px-3">
                          Заморозить
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы точно хотите заморозить диспут?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => console.log('Диспут заморожен')}>
                            Заморозить диспут
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {dispute.disputeDetails.status === "Заморожен" && (
                  <>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-9 px-3">
                      Завершить
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
                      Отклонить
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Disputes Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Показано {disputesStartIndex + 1}-{Math.min(disputesEndIndex, totalDisputes)} из {totalDisputes} диспутов
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDisputesCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={disputesCurrentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalDisputesPages) }, (_, i) => {
                let pageNum;
                if (totalDisputesPages <= 5) {
                  pageNum = i + 1;
                } else if (disputesCurrentPage <= 3) {
                  pageNum = i + 1;
                } else if (disputesCurrentPage >= totalDisputesPages - 2) {
                  pageNum = totalDisputesPages - 4 + i;
                } else {
                  pageNum = disputesCurrentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={disputesCurrentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisputesCurrentPage(pageNum)}
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
              onClick={() => setDisputesCurrentPage(prev => Math.min(prev + 1, totalDisputesPages))}
              disabled={disputesCurrentPage === totalDisputesPages}
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