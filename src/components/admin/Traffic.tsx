import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Loader2, Copy, CheckCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface TrafficRecord {
  id: string;
  trader_id: string;
  merchant_id: string;
  trader_reward: number;
  trader_priority: number;
  platform_fee: number;
  enabled: boolean;
}

interface CreateTrafficForm {
  id?: string;
  merchant_id: string;
  trader_id: string;
  platform_fee: string;
  trader_reward: string;
  trader_priority: string;
  enabled: boolean;
}

export default function TrafficTab() {
  const [traders, setTraders] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<User[]>([]);
  const [trafficList, setTrafficList] = useState<TrafficRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  const initialForm: CreateTrafficForm = {
    merchant_id: "",
    trader_id: "",
    platform_fee: "",
    trader_reward: "",
    trader_priority: "",
    enabled: true,
  };

  const [form, setForm] = useState<CreateTrafficForm>(initialForm);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Получаем мерчантов, трейдеров и тимлидов параллельно
      const [merchantRes, traderRes, teamLeadRes, trafficRes] = await Promise.all([
        apiClient.get("/admin/users?role=MERCHANT"),
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD"),
        apiClient.get("/admin/traffic/records?page=1&limit=100")
      ]);
      
      // Объединяем трейдеров и тимлидов в один список
      const allTraders = [
        ...(traderRes.data.users || []),
        ...(teamLeadRes.data.users || [])
      ];
      
      setMerchants(merchantRes.data.users || []);
      setTraders(allTraders);
      setTrafficList(trafficRes.data.traffic_records || []);
    } catch (err: any) {
      console.error("Ошибка при загрузке данных:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные трафика",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    // Обновляем форму
    setForm(prevForm => ({
      ...prevForm,
      [field]: value
    }));
  
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
    }
  };
  
  // Добавляем useEffect для валидации reward/fee
  useEffect(() => {
    const reward = parseFloat(form.trader_reward) || 0;
    const fee = parseFloat(form.platform_fee) || 0;
    
    if (reward > fee) {
      setErrors(prevErrors => ({ ...prevErrors, reward: "Награда не может превышать комиссию" }));
    } else if (errors.reward) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors.reward;
        return newErrors;
      });
    }
  }, [form.trader_reward, form.platform_fee]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    const reward = parseFloat(form.trader_reward) || 0;
    const fee = parseFloat(form.platform_fee) || 0;
    const priority = parseInt(form.trader_priority) || 0;
    
    if (reward > fee) {
      newErrors.reward = "Награда трейдера не может превышать комиссию платформы";
    }
    
    if (!form.merchant_id) {
      newErrors.merchant_id = "Выберите мерчанта";
    }
    
    if (!form.trader_id) {
      newErrors.trader_id = "Выберите трейдера";
    }
    
    if (!form.platform_fee || isNaN(fee)) {
      newErrors.platform_fee = "Введите корректную комиссию";
    } else if (fee < 0) {
      newErrors.platform_fee = "Комиссия не может быть отрицательной";
    }
    
    if (!form.trader_reward || isNaN(reward)) {
      newErrors.trader_reward = "Введите корректную награду";
    } else if (reward < 0) {
      newErrors.trader_reward = "Награда не может быть отрицательной";
    }
    
    if (!form.trader_priority || isNaN(priority)) {
      newErrors.trader_priority = "Введите корректный приоритет";
    } else if (priority < 0) {
      newErrors.trader_priority = "Приоритет не может быть отрицательным";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Ошибка валидации",
        description: "Исправьте ошибки в форме",
        variant: "destructive"
      });
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Правильное преобразование чисел с валидацией
      const traderPriority = parseInt(form.trader_priority);
      const traderReward = parseFloat(form.trader_reward);
      const platformFee = parseFloat(form.platform_fee);
      
      // Проверка на корректность преобразования
      if (isNaN(traderPriority) || isNaN(traderReward) || isNaN(platformFee)) {
        throw new Error("Некорректные числовые значения");
      }
      
      // Убеждаемся, что приоритет положительный
      const absolutePriority = Math.abs(traderPriority);
      
      // Создаем объект traffic с id для редактирования
      const trafficData = {
        id: form.id,
        merchant_id: form.merchant_id,
        trader_id: form.trader_id,
        trader_priority: absolutePriority,
        trader_reward: traderReward / 100,
        platform_fee: platformFee / 100,
        enabled: form.enabled,
      };
      
      if (editing) {
        // Для редактирования отправляем объект с id внутри traffic
        await apiClient.patch("/admin/traffic/edit", { 
          traffic: trafficData 
        });
        toast({
          title: "Трафик обновлён",
          description: "Настройки трафика успешно обновлены",
        });
      } else {
        // Для создания отправляем без id
        const { id, ...createData } = trafficData;
        await apiClient.post("/admin/traffic/create", createData);
        toast({
          title: "Трафик создан",
          description: "Новая запись трафика успешно создана",
        });
      }
      
      setForm(initialForm);
      setEditing(false);
      setErrors({});
      fetchData();
    } catch (err: any) {
      console.error("Ошибка при сохранении трафика:", err);
      toast({
        title: "Ошибка сохранения",
        description: err.response?.data?.message || err.message || "Не удалось сохранить настройки трафика",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (traffic: TrafficRecord) => {
    setForm({
      id: traffic.id,
      merchant_id: traffic.merchant_id,
      trader_id: traffic.trader_id,
      platform_fee: (traffic.platform_fee * 100).toFixed(3),
      trader_reward: (traffic.trader_reward * 100).toFixed(3),
      trader_priority: traffic.trader_priority.toString(),
      enabled: traffic.enabled,
    });
    setEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditing(false);
    setErrors({});
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [field]: false }));
      }, 2000);
    } catch (err) {
      console.error("Ошибка при копировании:", err);
    }
  };

  const renderUserInfo = (id: string, list: User[]) => {
    if (!id) return <span className="text-muted-foreground">—</span>;
    
    const user = list.find(u => u.id === id);
    if (!user) return <span className="text-sm">{id.substring(0, 8)}...</span>;
    
    const shortId = id.length > 6 ? `${id.substring(0, 6)}...` : id;
    
    return (
      <div className="space-y-1">
        <div className="font-medium text-sm">{user.username}</div>
        <div className="text-xs text-muted-foreground">({user.login})</div>
        <div 
          className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onClick={() => copyToClipboard(id, `user-${id}`)}
          title="Нажмите, чтобы скопировать ID"
        >
          <span>{shortId}</span>
          {copyStatus[`user-${id}`] ? (
            <CheckCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </div>
      </div>
    );
  };

  const formatDecimal = (value: number): string => {
    return value.toFixed(3);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Управление трафиком
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create new record panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {editing ? "Редактирование трафика" : "Создание новой записи"}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="merchant_id" className="text-sm font-medium">
                  Мерчант *
                </Label>
                <Select 
                  value={form.merchant_id} 
                  onValueChange={(value) => handleChange("merchant_id", value)}
                >
                  <SelectTrigger className={errors.merchant_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Выберите мерчанта" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id}>
                        {merchant.username} ({merchant.login})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.merchant_id && (
                  <div className="text-red-500 text-xs">{errors.merchant_id}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trader_id" className="text-sm font-medium">
                  Трейдер *
                </Label>
                <Select 
                  value={form.trader_id} 
                  onValueChange={(value) => handleChange("trader_id", value)}
                >
                  <SelectTrigger className={errors.trader_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Выберите трейдера" />
                  </SelectTrigger>
                  <SelectContent>
                    {traders.map((trader) => (
                      <SelectItem key={trader.id} value={trader.id}>
                        {trader.username} ({trader.login})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.trader_id && (
                  <div className="text-red-500 text-xs">{errors.trader_id}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform_fee" className="text-sm font-medium">
                  Комиссия платформы (%) *
                </Label>
                <Input
                  id="platform_fee"
                  type="text"
                  placeholder="9.500"
                  value={form.platform_fee}
                  onChange={(e) => handleChange("platform_fee", e.target.value)}
                  className={errors.platform_fee ? "border-red-500" : ""}
                />
                {errors.platform_fee && (
                  <div className="text-red-500 text-xs">{errors.platform_fee}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  До тысячных: 0.001
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trader_reward" className="text-sm font-medium">
                  Награда трейдера (%) *
                </Label>
                <Input
                  id="trader_reward"
                  type="text"
                  placeholder="8.000"
                  value={form.trader_reward}
                  onChange={(e) => handleChange("trader_reward", e.target.value)}
                  className={errors.trader_reward ? "border-red-500" : ""}
                />
                {errors.reward && (
                  <div className="text-red-500 text-xs">{errors.reward}</div>
                )}
                {errors.trader_reward && (
                  <div className="text-red-500 text-xs">{errors.trader_reward}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Максимум: {form.platform_fee || "0.000"}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trader_priority" className="text-sm font-medium">
                  Приоритет трейдера *
                </Label>
                <Input
                  id="trader_priority"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={form.trader_priority}
                  onChange={(e) => {
                    // Предотвращаем ввод отрицательных значений
                    const value = e.target.value;
                    if (value === '' || parseInt(value) >= 0) {
                      handleChange("trader_priority", value);
                    }
                  }}
                  className={errors.trader_priority ? "border-red-500" : ""}
                />
                {errors.trader_priority && (
                  <div className="text-red-500 text-xs">{errors.trader_priority}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Целое положительное число, чем выше - тем больше сделок
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="enabled" className="text-sm font-medium block">
                  Активный трафик
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={form.enabled}
                    onCheckedChange={(checked) => handleChange("enabled", checked)}
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    {form.enabled ? "Активен" : "Неактивен"}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-start gap-2 mt-4">
              <Button 
                type="submit"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editing ? "Сохранение..." : "Создание..."}
                  </>
                ) : (
                  editing ? "Обновить" : "Создать"
                )}
              </Button>
              
              {editing && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Отменить
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Traffic settings table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Настройки трафика</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Загрузка настроек трафика...</span>
            </div>
          ) : trafficList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет записей о трафике
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Статус</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Мерчант</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Трейдер</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Награда</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Приоритет</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Комиссия</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {trafficList.map((traffic) => (
                    <tr key={traffic.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <Badge 
                          variant={traffic.enabled ? "default" : "secondary"}
                          className={traffic.enabled 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }
                        >
                          {traffic.enabled ? "Активен" : "Неактивен"}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        {renderUserInfo(traffic.merchant_id, merchants)}
                      </td>
                      <td className="p-4 align-middle">
                        {renderUserInfo(traffic.trader_id, traders)}
                      </td>
                      <td className="p-4 align-middle font-mono text-sm">
                        {formatDecimal(traffic.trader_reward * 100)}%
                      </td>
                      <td className="p-4 align-middle font-mono text-sm">
                        {traffic.trader_priority}
                      </td>
                      <td className="p-4 align-middle font-mono text-sm">
                        {formatDecimal(traffic.platform_fee * 100)}%
                      </td>
                      <td className="p-4 align-middle">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(traffic)}
                        >
                          Редактировать
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}