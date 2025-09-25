// tabs/TelegramTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function TelegramTab() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopied(false);
    setToken('');
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/login', { login, password });
      setToken(res.data.access_token);
      toast({
        title: "Успешный вход",
        description: "Токен успешно сгенерирован",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Неверный логин или пароль';
      setError(errorMessage);
      toast({
        title: "Ошибка входа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!token) return;
    
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast({
      title: "Скопировано",
      description: "Токен скопирован в буфер обмена",
    });
    
    // Сброс состояния копирования через 2 секунды
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const clearForm = () => {
    setLogin('');
    setPassword('');
    setToken('');
    setError('');
    setCopied(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Интеграция с Телеграм
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Генерация токена</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                type="text"
                placeholder="Введите логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading || !login || !password}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
              
              {(login || password || token) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearForm}
                  disabled={loading}
                >
                  Очистить
                </Button>
              )}
            </div>
          </form>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Отображение токена */}
          {token && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Сгенерированный токен:</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-1 text-xs">
                    {copied ? 'Скопировано' : 'Копировать'}
                  </span>
                </Button>
              </div>
              
              <div 
                className="p-3 bg-background rounded border font-mono text-sm break-all cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={handleCopy}
                title="Кликните для копирования"
              >
                {token}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Токен действителен для использования в телеграм боте. Сохраните его в безопасном месте.
              </p>
            </div>
          )}

          {/* Инструкция */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Инструкция по использованию:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Введите логин и пароль от вашего аккаунта</li>
              <li>Нажмите &quot;Войти&quot; для генерации токена</li>
              <li>Скопируйте полученный токен</li>
              <li>Используйте токен для настройки телеграм бота</li>
              <li>Токен предоставляет доступ к apiClient системы</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}