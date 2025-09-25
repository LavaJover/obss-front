import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface Merchant {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface CreateMerchantForm {
  username: string;
  login: string;
  password: string;
}

export default function MerchantsTab() {
  const [form, setForm] = useState<CreateMerchantForm>({
    username: "",
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiClient.post("/admin/merchants/create", form);
      toast({
        title: "Мерчант создан",
        description: "Новый мерчант успешно создан",
      });
      
      setForm({ username: "", login: "", password: "" });
      fetchMerchants(); // Обновляем список после создания
    } catch (err: any) {
      console.error("Ошибка при создании мерчанта:", err);
      toast({
        title: "Ошибка создания",
        description: err.response?.data?.message || "Не удалось создать мерчанта",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    setFetching(true);
    try {
      const response = await apiClient.get("/admin/merchants");
      setMerchants(response.data.users || []);
    } catch (err: any) {
      console.error("Ошибка при получении списка мерчантов:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список мерчантов",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Управление мерчантами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Форма создания нового мерчанта */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="username" className="text-sm font-medium mb-2 block">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Введите username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="login" className="text-sm font-medium mb-2 block">
                Login
              </Label>
              <Input
                id="login"
                name="login"
                type="text"
                placeholder="Введите login"
                value={form.login}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Введите пароль"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  "Создать мерчанта"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Таблица мерчантов */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Список мерчантов</h3>
          
          {fetching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Загрузка мерчантов...</span>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Username</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Login</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {merchants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        Мерчанты не найдены
                      </td>
                    </tr>
                  ) : (
                    merchants.map((merchant) => (
                      <tr key={merchant.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-mono text-xs">{merchant.id}</td>
                        <td className="p-4 align-middle">{merchant.username}</td>
                        <td className="p-4 align-middle">{merchant.login}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                            {merchant.role === "MERCHANT" ? "Мерчант" : merchant.role}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}