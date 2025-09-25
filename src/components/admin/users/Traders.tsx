import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  login: string;
  role: "TRADER" | "TEAMLEAD";
}

interface CreateUserForm {
  username: string;
  login: string;
  password: string;
}

export default function TradersTab() {
  const [form, setForm] = useState<CreateUserForm>({
    username: "",
    login: "",
    password: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Состояние для модального окна подтверждения
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: null as "promote" | "demote" | null,
    userId: null as string | null,
    username: "",
    message: ""
  });

  const fetchUsers = async () => {
    setFetching(true);
    try {
      // Загружаем трейдеров и тим-лидов параллельно
      const [tradersRes, teamLeadsRes] = await Promise.all([
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD")
      ]);
      
      // Объединяем результаты в один список
      const combinedUsers = [
        ...(tradersRes.data.users || []).map((u: any) => ({ ...u, role: "TRADER" as const })),
        ...(teamLeadsRes.data.users || []).map((u: any) => ({ ...u, role: "TEAMLEAD" as const }))
      ];
      
      setUsers(combinedUsers);
    } catch (err: any) {
      console.error("Ошибка при загрузке пользователей:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiClient.post("/admin/teams/create", form);
      toast({
        title: "Трейдер создан",
        description: "Новый трейдер успешно создан",
      });
      
      setForm({ username: "", login: "", password: "" });
      fetchUsers(); // Обновляем список после создания
    } catch (err: any) {
      console.error("Ошибка при создании трейдера:", err);
      toast({
        title: "Ошибка создания",
        description: err.response?.data?.message || "Не удалось создать трейдера",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Открытие модального окна для подтверждения действия
  const openConfirmationModal = (actionType: "promote" | "demote", userId: string, username: string) => {
    let message = "";
    if (actionType === "promote") {
      message = `Вы уверены, что хотите повысить пользователя ${username} до тим-лида?`;
    } else {
      message = `Вы уверены, что хотите понизить пользователя ${username} до трейдера?`;
    }
    
    setConfirmationModal({
      isOpen: true,
      actionType,
      userId,
      username,
      message
    });
  };

  // Закрытие модального окна
  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      actionType: null,
      userId: null,
      username: "",
      message: ""
    });
  };

  // Подтверждение действия
  const confirmAction = async () => {
    const { actionType, userId } = confirmationModal;
    
    if (!actionType || !userId) return;
    
    try {
      if (actionType === "promote") {
        await apiClient.post(`/admin/teams/traders/${userId}/promote-to-teamlead`, {});
        toast({
          title: "Пользователь повышен",
          description: "Пользователь успешно повышен до тим-лида",
        });
      } else {
        await apiClient.post(`/admin/teams/teamleads/${userId}/demote`, {});
        toast({
          title: "Пользователь понижен",
          description: "Тим-лид успешно понижен до трейдера",
        });
      }
      
      fetchUsers(); // Обновляем список пользователей
    } catch (err: any) {
      console.error("Ошибка при изменении роли пользователя:", err);
      const action = actionType === "promote" ? "повышения" : "понижения";
      toast({
        title: `Ошибка ${action}`,
        description: err.response?.data?.message || `Не удалось выполнить ${action} пользователя`,
        variant: "destructive"
      });
    } finally {
      closeConfirmationModal();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Управление трейдерами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Форма создания нового трейдера */}
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
                  "Создать трейдера"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Таблица трейдеров и тим-лидов */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Список трейдеров и тим-лидов</h3>
          
          {fetching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Загрузка пользователей...</span>
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
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-mono text-xs">{user.id}</td>
                        <td className="p-4 align-middle">{user.username}</td>
                        <td className="p-4 align-middle">{user.login}</td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={user.role === "TEAMLEAD" ? "default" : "secondary"}
                            className={user.role === "TEAMLEAD" ? "bg-primary text-primary-foreground" : ""}
                          >
                            {user.role === "TRADER" ? "Трейдер" : "Тим-лид"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          {user.role === "TRADER" ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openConfirmationModal("promote", user.id, user.username)}
                            >
                              Повысить до тим-лида
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openConfirmationModal("demote", user.id, user.username)}
                            >
                              Понизить до трейдера
                            </Button>
                          )}
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

      {/* Модальное окно подтверждения */}
      <AlertDialog open={confirmationModal.isOpen} onOpenChange={closeConfirmationModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение действия</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationModal.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationModal}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}