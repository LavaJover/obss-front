// tabs/WalletsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function WalletsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Управление кошельками
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User/Platform Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Выберите пользователя или платформу</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Выберите пользователя</option>
              <option value="user1">john_trader (john.doe)</option>
              <option value="user2">sarah_lead (sarah.smith)</option>
              <option value="platform1">Платформа - Основной кошелек</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Выбор кошелька</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Выберите кошелек</option>
              <option value="wallet1">USDT Wallet (TUowL9EwagYcezrKNXd6Y4XhpCts3qHYLn)</option>
              <option value="wallet2">BTC Wallet (1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)</option>
            </select>
          </div>
        </div>

        {/* Wallet Information Block */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Информация о кошельке</h3>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
                Вывод средств
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Адрес:</span> TUowL9EwagYcezrKNXd6Y4XhpCts3qHYLn</p>
              <p className="text-sm"><span className="font-medium">Баланс:</span> -0.5401389845963962 USDT</p>
              <p className="text-sm"><span className="font-medium">Заморожено:</span> 0.000003138556010640059 USDT</p>
            </div>
          </div>

          {/* Deposit Block */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Пополнение кошелька</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Сумма депозита</label>
                <input
                  type="text"
                  placeholder="Введите сумму"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
                Пополнить
              </button>
            </div>
          </div>

          {/* Withdrawal Block */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Списание средств</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Сумма списания</label>
                <input
                  type="text"
                  placeholder="Введите сумму"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
                Списать
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}