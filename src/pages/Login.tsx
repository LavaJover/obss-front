import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials = {
        login: username,
        password,
        ...(showTwoFactor && { two_fa_code: twoFactorCode })
      };

      const response = await authService.login(credentials);
      
      login(response.access_token);
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!",
      });
      navigate('/');
      
    } catch (error: any) {
      if (error.response?.data?.error?.includes('2FA_REQUIRED')) {
        setShowTwoFactor(true);
        toast({
          title: "Требуется 2FA",
          description: "Введите код двухфакторной аутентификации",
        });
      } else {
        toast({
          title: "Ошибка входа",
          description: error.response?.data?.message || "Неверные учетные данные",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showTwoFactor ? 'Двухфакторная аутентификация' : 'Вход в систему'}
          </CardTitle>
          <CardDescription>
            {showTwoFactor 
              ? 'Введите код из приложения аутентификации'
              : 'Введите свои данные для входа в систему'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!showTwoFactor ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите логин"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Код аутентификации</Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Введите 6-значный код"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Проверка..." : showTwoFactor ? "Подтвердить" : "Войти"}
            </Button>

            {showTwoFactor && (
              <Button 
                type="button"
                variant="ghost" 
                className="w-full" 
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                }}
                disabled={isLoading}
              >
                Назад к входу
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;