import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, QrCode, Smartphone, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deviceService } from "@/services/deviceService";

interface Device {
  deviceId: string;
  deviceName: string;
  enabled: boolean;
}

interface DeviceManagerProps {
  devices: Device[];
  loading: boolean;
  devicesDialogOpen: boolean;
  setDevicesDialogOpen: (open: boolean) => void;
  qrDialogOpen: boolean;
  setQrDialogOpen: (open: boolean) => void;
  currentQrDevice: { deviceId: string; deviceName: string } | null;
  setCurrentQrDevice: (device: { deviceId: string; deviceName: string } | null) => void;
  deviceFormData: { name: string; status: string };
  setDeviceFormData: (data: { name: string; status: string }) => void;
  deviceErrors: { [key: string]: string };
  editingDeviceId: string | null;
  setEditingDeviceId: (id: string | null) => void;
  onAddDevice: (deviceData: { deviceName: string; enabled: boolean }) => Promise<void>;
  onUpdateDevice: (id: string, deviceData: { deviceName: string; enabled: boolean }) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
  onShowQr: (device: Device) => void;
  generateQrData: () => string;
  getJwtToken: () => string | null;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  loading,
  devicesDialogOpen,
  setDevicesDialogOpen,
  qrDialogOpen,
  setQrDialogOpen,
  currentQrDevice,
  setCurrentQrDevice,
  deviceFormData,
  setDeviceFormData,
  deviceErrors,
  editingDeviceId,
  setEditingDeviceId,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  onShowQr,
  generateQrData,
  getJwtToken,
}) => {
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deviceStatuses, setDeviceStatuses] = useState<{ [key: string]: { online: boolean; lastPing?: number } }>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false); // ← НОВЫЙ STATE

  // Загрузка статусов устройств
const fetchDevicesStatus = async () => {
    setStatusLoading(true);
    try {
      const statuses: { [key: string]: any } = {};
      
      for (const device of devices) {
        try {
          console.log(`🔄 Fetching status for device: ${device.deviceId}`);
          const status = await deviceService.getDeviceStatus(device.deviceId);
          console.log(`📱 Device ${device.deviceId} status:`, status);
          
          statuses[device.deviceId] = {
            online: status.online,
            lastPing: status.last_ping,
            rawStatus: status // добавляем для отладки
          };
        } catch (error) {
          console.error(`❌ Error fetching status for device ${device.deviceId}:`, error);
          statuses[device.deviceId] = { 
            online: false,
            error: error.message 
          };
        }
      }
      
      setDeviceStatuses(statuses);
    } catch (error) {
      console.error("❌ Error fetching devices status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (devices.length > 0) {
      fetchDevicesStatus();
      
      const interval = setInterval(fetchDevicesStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [devices.length]);

  const handleSaveDevice = async () => {
    if (!deviceFormData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название устройства",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editingDeviceId) {
        await onUpdateDevice(editingDeviceId, {
          deviceName: deviceFormData.name,
          enabled: true
        });
        toast({
          title: "Успех",
          description: "Устройство обновлено",
        });
      } else {
        await onAddDevice({
          deviceName: deviceFormData.name,
          enabled: true
        });
        toast({
          title: "Успех",
          description: "Устройство добавлено",
        });
      }
      
      // Закрываем форму
      setAddFormOpen(false);
      setDeviceFormData({ name: "", status: "active" });
      setEditingDeviceId(null);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось сохранить",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;
    setFormLoading(true);
    try {
      await onDeleteDevice(deviceToDelete.deviceId);
      toast({
        title: "Успех",
        description: "Устройство удалено",
      });
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось удалить",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatLastPing = (timestamp?: number) => {
    if (!timestamp) return "Никогда";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Только что";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} мин назад`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} часов назад`;

    return date.toLocaleString("ru-RU");
  };

  const closeAddForm = () => {
    setAddFormOpen(false);
    setDeviceFormData({ name: "", status: "active" });
    setEditingDeviceId(null);
  };

  return (
    <>
      {/* Main Dialog - Управление устройствами */}
      <Dialog open={devicesDialogOpen} onOpenChange={setDevicesDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Управление устройствами</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Устройства не добавлены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  const status = deviceStatuses[device.deviceId];
                  const isOnline = status?.online ?? false;
                  
                  return (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{device.deviceName}</p>
                          
                          {isOnline ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Онлайн
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-300 hover:bg-gray-400">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Оффлайн
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>ID: {device.deviceId}</p>
                          {status && (
                            <p>Последний пинг: {formatLastPing(status.lastPing)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onShowQr(device)}
                          title="Показать QR код"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDeviceId(device.deviceId);
                            setDeviceFormData({ name: device.deviceName, status: "active" });
                            setAddFormOpen(true); // ← ОТКРЫВАЕМ ФОРМУ
                          }}
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeviceToDelete(device);
                            setDeleteDialogOpen(true);
                          }}
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setEditingDeviceId(null);
                setDeviceFormData({ name: "", status: "active" });
                setAddFormOpen(true); // ← ОТКРЫВАЕМ ФОРМУ
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить устройство
            </Button>
            <Button variant="outline" onClick={() => setDevicesDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog для Add/Edit */}
      <Dialog open={addFormOpen} onOpenChange={closeAddForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDeviceId ? "Редактировать устройство" : "Добавить устройство"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Название устройства</Label>
              <Input
                placeholder="iPhone 13, Samsung A12"
                value={deviceFormData.name}
                onChange={(e) =>
                  setDeviceFormData({ ...deviceFormData, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleSaveDevice()}
                autoFocus
              />
              {deviceErrors.name && (
                <p className="text-red-500 text-sm mt-1">{deviceErrors.name}</p>
              )}
            </div>

            {!editingDeviceId && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  💡 После создания вы сможете отсканировать QR код в мобильном приложении для привязки устройства.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAddForm}
              disabled={formLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleSaveDevice} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
{/* QR Dialog */}
<Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>QR-код для привязки устройства</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {currentQrDevice && getJwtToken() ? (
        <>
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <img
                src={`https://qrcode.tec-it.com/api/qr?data=${encodeURIComponent(
                  generateQrData()
                )}&size=m`}
                alt="QR код для привязки устройства"
                className="h-48 w-48"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-center">
              {currentQrDevice.deviceName}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Отсканируйте этот QR код в мобильном приложении для привязки устройства
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-900 dark:text-yellow-300">
              ⚠️ QR код доступен в течение 10 минут. Если срок истек, создайте новое устройство.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Загрузка QR кода...</p>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button 
        onClick={() => setQrDialogOpen(false)}
        variant="outline"
      >
        Закрыть
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить устройство?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Устройство "{deviceToDelete?.deviceName}" будет удалено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={formLoading}
              className="bg-destructive"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeviceManager;
