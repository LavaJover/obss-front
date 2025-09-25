import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Smartphone, QrCode, Copy, RotateCcw, AlertTriangle, CheckCircle, Download } from "lucide-react";
import QRCode from "qrcode";
import apiClient from "@/lib/api-client";

export default function Settings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'disabled' | 'setup' | 'verify' | 'complete'>('disabled');
  const [secretKey, setSecretKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Запрос к бэкенду для настройки 2FA
  const setup2FA = async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await apiClient.post('/2fa/setup');
      setSecretKey(resp.data.secret_key || "JBSWY3DPEHPK3PXP");
      
      if (resp.data.qr_url) {
        const qrCodeDataUrl = await QRCode.toDataURL(resp.data.qr_url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrCodeDataUrl);
      }
    } catch (err) {
      setError('Ошибка при загрузке QR-кода');
      console.error('2FA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Включение 2FA
  const handleEnable2FA = async () => {
    if (!twoFactorEnabled) {
      setSetupStep('setup');
      await setup2FA();
    }
    // Убрана возможность выключения 2FA
  };

  // Верификация кода
  const handleVerification = async () => {
    if (verificationCode.length !== 6) return;

    try {
      setLoading(true);
      setError("");
      const resp = await apiClient.post('/2fa/verify', { code: verificationCode });
      
      if (resp.status === 200) {
        setTwoFactorEnabled(true);
        setSetupStep('complete');
        setSuccess(true);
        setError("");
      }
    } catch (err: any) {
      setSuccess(false);
      setError('Неверный код. Попробуйте снова.');
      console.error('2FA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Генерация резервных кодов (мок)
  const generateNewBackupCodes = () => {
    const newCodes = Array.from({length: 8}, () => 
      Math.random().toString(36).substring(2, 10)
    );
    setBackupCodes(newCodes);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Инициализация резервных кодов
  useEffect(() => {
    generateNewBackupCodes();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Настройки безопасности</h1>
      </div>

      {/* Enhanced Two-Factor Authentication */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            Двухфакторная аутентификация
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Защитите свой аккаунт дополнительным уровнем безопасности
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">Статус защиты:</span>
                <Badge 
                  variant={twoFactorEnabled ? "default" : "destructive"}
                  className={twoFactorEnabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : ""}
                >
                  {twoFactorEnabled ? "Активна" : "Не активна"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled 
                  ? "Ваш аккаунт защищен двухфакторной аутентификацией"
                  : "Рекомендуем включить 2FA для повышения безопасности"
                }
              </p>
            </div>
            
            {/* Switch только для включения 2FA */}
            {!twoFactorEnabled && (
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleEnable2FA}
                disabled={loading}
                className="data-[state=checked]:bg-emerald-600"
              />
            )}
          </div>

          {/* Setup Process */}
          {setupStep === 'setup' && (
            <div className="space-y-6 p-6 bg-muted/50 rounded-lg border">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Настройка 2FA</h3>
                <p className="text-sm text-muted-foreground">
                  Отсканируйте QR-код в приложении аутентификатора
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-primary/20 shadow-sm">
                  {loading ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-muted-foreground animate-pulse" />
                    </div>
                  ) : qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="2FA QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                      Ошибка загрузки QR-кода
                    </div>
                  )}
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Секретный ключ (если не можете отсканировать QR-код):</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={secretKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(secretKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Введите код из приложения аутентификатора:
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                    disabled={loading}
                  />
                  <Button 
                    onClick={handleVerification}
                    disabled={verificationCode.length !== 6 || loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? "Проверка..." : "Подтвердить"}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Важно:</strong> Убедитесь, что ваше приложение аутентификатора правильно настроено перед подтверждением.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success State */}
          {setupStep === 'complete' && (
            <div className="space-y-4 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-800 dark:text-emerald-200">
                  2FA успешно настроена!
                </span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Теперь ваш аккаунт защищен двухфакторной аутентификацией
              </p>
            </div>
          )}

          {/* Active 2FA Management */}
          {twoFactorEnabled && setupStep !== 'setup' && setupStep !== 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    2FA активна
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Используйте приложение аутентификатора для входа
                  </p>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="space-y-4 p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Резервные коды</h4>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={generateNewBackupCodes}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Сгенерировать новые
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Сохраните эти коды в безопасном месте. Каждый код можно использовать только один раз.
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm"
                    >
                      <span>{code}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать коды
                </Button>
              </div>
            </div>
          )}

          {/* App Recommendations */}
          {setupStep === 'setup' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Рекомендуемые приложения:
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div>• Google Authenticator</div>
                <div>• Microsoft Authenticator</div>
                <div>• Authy</div>
                <div>• 1Password</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}