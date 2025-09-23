// tabs/WalletsTab.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Copy, CheckCheck, Loader2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface WalletInfo {
  address?: string;
  balance: number;
  frozen?: number;
  currency: string;
}

export default function WalletsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState({
    users: true,
    wallet: false,
    withdraw: false
  });
  
  // Состояния для модальных окон
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showOnchainWithdrawModal, setShowOnchainWithdrawModal] = useState(false);
  
  // Состояния для вывода on-chain
  const [onchainWithdrawData, setOnchainWithdrawData] = useState({
    amount: "",
    toAddress: ""
  });
  const [withdrawResult, setWithdrawResult] = useState<{success: boolean; txid?: string; error?: string; details?: string} | null>(null);
  const [onchainErrors, setOnchainErrors] = useState<{[key: string]: string}>({});
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/admin/users");
      
      // Добавляем кошелёк платформы в список пользователей
      const platformUser = {
        id: "platform",
        login: "platform",
        role: "PLATFORM",
        username: "Платформа"
      };
      
      setUsers([platformUser, ...(res.data.users || [])]);
    } catch (err: any) {
      console.error("Ошибка загрузки пользователей", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchWallet = async (userId: string) => {
    setLoading(prev => ({ ...prev, wallet: true }));
    try {
      // Для платформы используем специальный endpoint
      const endpoint = userId === "platform" 
        ? "/wallets/platform/balance" 
        : `/wallets/${userId}/balance`;
      
      const res = await apiClient.get(endpoint);
      
      // Для платформы добавляем специальную валюту, если не указана
      const walletData = userId === "platform"
        ? { ...res.data, currency: res.data.currency || "PLAT" }
        : res.data;
        
      setWallet(walletData);
    } catch (err: any) {
      console.error("Ошибка получения баланса", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось получить данные кошелька",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    setWallet(null);
    setWithdrawResult(null);
    if (userId) {
      fetchWallet(userId);
    }
  };

  const openDepositModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Введите корректную сумму для пополнения",
        variant: "destructive"
      });
      return;
    }
    setShowDepositModal(true);
  };

  const openWithdrawModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Введите корректную сумму для списания",
        variant: "destructive"
      });
      return;
    }
    
    setShowWithdrawModal(true);
  };

  const openOnchainWithdrawModal = () => {
    if (selectedUser === "platform") {
      toast({
        title: "Ошибка",
        description: "Вывод on-chain недоступен для платформы",
        variant: "destructive"
      });
      return;
    }
    
    setShowOnchainWithdrawModal(true);
    setOnchainWithdrawData({ amount: "", toAddress: "" });
    setWithdrawResult(null);
    setOnchainErrors({});
  };

  const handleDeposit = async () => {
    setShowDepositModal(false);
    try {
      // Для платформы используем специальный endpoint
      const endpoint = selectedUser === "platform"
        ? "/wallets/platform/deposit"
        : "/wallets/deposit";
      
      await apiClient.post(endpoint, {
        amount: parseFloat(depositAmount),
        traderId: selectedUser === "platform" ? null : selectedUser,
        txHash: "admin-deposit",
      });
      
      toast({
        title: "Успех",
        description: `Баланс пополнен на ${depositAmount} ${wallet?.currency}`
      });
      fetchWallet(selectedUser);
      setDepositAmount("");
    } catch (err: any) {
      console.error("Ошибка пополнения", err);
      toast({
        title: "Ошибка",
        description: "Не удалось пополнить баланс",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = async () => {
    setShowWithdrawModal(false);
    try {
      // Для платформы используем специальный endpoint
      const endpoint = selectedUser === "platform"
        ? "/wallets/platform/withdraw"
        : "/wallets/offchain-withdraw";
      
      await apiClient.post(endpoint, {
        amount: parseFloat(withdrawAmount),
        traderId: selectedUser === "platform" ? null : selectedUser,
        txHash: "admin-withdraw",
      });
      
      toast({
        title: "Успех",
        description: `Средства списаны: ${withdrawAmount} ${wallet?.currency}`
      });
      fetchWallet(selectedUser);
      setWithdrawAmount("");
    } catch (err: any) {
      console.error("Ошибка списания", err);
      toast({
        title: "Ошибка",
        description: "Не удалось списать средства",
        variant: "destructive"
      });
    }
  };

  const validateOnchainWithdraw = () => {
    const errors: {[key: string]: string} = {};
    const amount = parseFloat(onchainWithdrawData.amount);
    
    if (!amount || amount <= 0) {
      errors.amount = "Введите корректную сумму";
    } else if (amount > (wallet?.balance || 0)) {
      errors.amount = "Сумма превышает доступный баланс";
    }
    
    if (!onchainWithdrawData.toAddress) {
      errors.toAddress = "Введите адрес кошелька";
    }
    
    setOnchainErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOnchainWithdraw = async () => {
    if (!validateOnchainWithdraw()) return;
    
    setLoading(prev => ({ ...prev, withdraw: true }));
    setWithdrawResult(null);
    
    try {
      const response = await apiClient.post("/wallets/withdraw", {
        amount: parseFloat(onchainWithdrawData.amount),
        toAddress: onchainWithdrawData.toAddress,
        traderId: selectedUser
      });
      
      setWithdrawResult({
        success: true,
        txid: response.data.txid
      });
      
      // Обновляем баланс после вывода
      fetchWallet(selectedUser);
    } catch (err: any) {
      console.error("Ошибка вывода on-chain", err.response?.data || err);
      setWithdrawResult({
        success: false,
        error: err.response?.data?.error || "Неизвестная ошибка",
        details: err.response?.data?.details || "Дополнительная информация отсутствует"
      });
    } finally {
      setLoading(prev => ({ ...prev, withdraw: false }));
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [field]: false }));
      }, 2000);
      toast({
        title: "Скопировано",
        description: "Текст скопирован в буфер обмена"
      });
    } catch (err) {
      console.error("Ошибка при копировании:", err);
    }
  };

  const closeOnchainModal = () => {
    setShowOnchainWithdrawModal(false);
    setWithdrawResult(null);
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(8);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
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
            <div className="space-y-2">
              <Label htmlFor="user-select" className="text-sm font-medium">
                Выберите пользователя или платформу
              </Label>
              {loading.users ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка пользователей...
                </div>
              ) : (
                <Select value={selectedUser} onValueChange={handleSelectUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        [{user.role}] {user.username} 
                        {user.id === "platform" && " (Системный кошелёк)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {loading.wallet && selectedUser && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Загрузка данных кошелька...</span>
            </div>
          )}

          {wallet && !loading.wallet && (
            <div className="space-y-4">
              {/* Wallet Information Block */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Информация о кошельке</h3>
                    {selectedUser !== "platform" && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={openOnchainWithdrawModal}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Вывод средств
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Адрес:</span>
                      <div 
                        className="flex items-center gap-1 text-sm cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => copyToClipboard(wallet.address || "Системный кошелёк", "address")}
                      >
                        <span className="font-mono">
                          {wallet.address ? `${wallet.address.substring(0, 12)}...` : "Системный кошелёк"}
                        </span>
                        {copyStatus.address ? (
                          <CheckCheck className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Баланс:</span>
                      <Badge 
                        variant={wallet.balance >= 0 ? "default" : "destructive"}
                        className="font-mono"
                      >
                        {formatAmount(wallet.balance)} {wallet.currency}
                      </Badge>
                    </div>
                    
                    {selectedUser !== "platform" && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Заморожено:</span>
                        <span className="text-sm font-mono">
                          {formatAmount(wallet.frozen || 0)} {wallet.currency}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Deposit Block */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Пополнение кошелька</h3>
                  <form onSubmit={openDepositModal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount" className="text-sm font-medium">
                        Сумма депозита
                      </Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="Введите сумму"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Пополнить
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Withdrawal Block */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Списание средств</h3>
                  <form onSubmit={openWithdrawModal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount" className="text-sm font-medium">
                        Сумма списания
                      </Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="Введите сумму"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="destructive">
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Списать
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно подтверждения депозита */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение пополнения</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите пополнить баланс{" "}
              <strong>
                {selectedUser === "platform" 
                  ? "платформы" 
                  : users.find(u => u.id === selectedUser)?.username || selectedUser}
              </strong>{" "}
              на сумму <strong>{depositAmount} {wallet?.currency}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleDeposit}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно подтверждения off-chain списания */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение списания</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите списать со счета{" "}
              <strong>
                {selectedUser === "platform" 
                  ? "платформы" 
                  : users.find(u => u.id === selectedUser)?.username || selectedUser}
              </strong>{" "}
              сумму <strong>{withdrawAmount} {wallet?.currency}</strong>?
            </DialogDescription>
          </DialogHeader>
          {selectedUser !== "platform" && parseFloat(withdrawAmount) > (wallet?.balance || 0) && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Внимание!</strong> Сумма списания превышает текущий баланс. 
                Это приведёт к отрицательному балансу пользователя.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleWithdraw}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно для вывода on-chain */}
      <Dialog open={showOnchainWithdrawModal} onOpenChange={closeOnchainModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вывод средств (On-chain)</DialogTitle>
          </DialogHeader>
          
          {!withdrawResult ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount-onchain" className="text-sm font-medium">
                    Сумма вывода
                  </Label>
                  <Input
                    id="withdraw-amount-onchain"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={onchainWithdrawData.amount}
                    onChange={(e) => setOnchainWithdrawData({
                      ...onchainWithdrawData,
                      amount: e.target.value
                    })}
                    placeholder={`Максимум: ${wallet?.balance || 0}`}
                    disabled={loading.withdraw}
                  />
                  {onchainErrors.amount && (
                    <div className="text-red-500 text-xs">{onchainErrors.amount}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="to-address" className="text-sm font-medium">
                    Адрес получателя
                  </Label>
                  <Input
                    id="to-address"
                    type="text"
                    value={onchainWithdrawData.toAddress}
                    onChange={(e) => setOnchainWithdrawData({
                      ...onchainWithdrawData,
                      toAddress: e.target.value
                    })}
                    placeholder="Введите адрес кошелька"
                    disabled={loading.withdraw}
                  />
                  {onchainErrors.toAddress && (
                    <div className="text-red-500 text-xs">{onchainErrors.toAddress}</div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeOnchainModal} disabled={loading.withdraw}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleOnchainWithdraw}
                  disabled={loading.withdraw}
                >
                  {loading.withdraw ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    "Подтвердить вывод"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {withdrawResult.success ? (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <h4 className="font-semibold">✅ Вывод успешно выполнен</h4>
                    <p>
                      <strong>ID транзакции:</strong>
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => copyToClipboard(withdrawResult.txid || "", "txid")}
                      >
                        <span className="font-mono text-sm">
                          {withdrawResult.txid?.substring(0, 20)}...
                        </span>
                        {copyStatus.txid ? (
                          <CheckCheck className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </div>
                    </p>
                    <p>Средства были отправлены на указанный адрес.</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription className="space-y-2">
                    <h4 className="font-semibold">❌ Ошибка вывода средств</h4>
                    <p><strong>Ошибка:</strong> {withdrawResult.error}</p>
                    <p><strong>Детали:</strong> {withdrawResult.details}</p>
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button onClick={closeOnchainModal}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}