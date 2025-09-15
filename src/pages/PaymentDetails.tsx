// src/components/PaymentDetails.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Phone, Building, Monitor, QrCode, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBankDetails } from "@/hooks/useBankDetails";
import { bankService, BankDetail } from "@/services/bankService";
import apiClient from "@/lib/api-client";

const banksList = [
  "Т-Банк",
  "Сбербанк", 
  "ВТБ",
  "Альфа-Банк",
  "Открытие",
  "Газпромбанк",
  "Россельхозбанк",
  "Рокетбанк",
  "МКБ",
  "Райффайзенбанк",
  "ЮMoney",
  "QIWI",
  "WebMoney"
];

// Функции форматирования
const formatCardNumber = (number: string) => {
  return number.replace(/(\d{4})/g, '$1 ').trim();
};

const formatCardNumberDisplay = (cardNumber: string): string => {
  return cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

const formatPhoneNumber = (phone: string) => {
  // Если номер начинается с 8, заменяем на +7
  let processedPhone = phone;
  if (phone.startsWith('8')) {
    processedPhone = '+7' + phone.substring(1);
  }
  
  const match = processedPhone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
};

const ProgressBar = ({
  current,
  max,
  percentage,
  type,
  label
}: {
  current: number;
  max: number;
  percentage: number;
  type: "deals" | "amount";
  label?: string;
}) => {
  return <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label || (type === "deals" ? "штук" : "₽")}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="h-2 rounded-full transition-all bg-primary" style={{
        width: `${Math.min(percentage, 100)}%`
      }} />
      </div>
      <div className="text-xs text-muted-foreground">
        {type === "amount" ? `${current.toLocaleString()} / ${max.toLocaleString()}` : `${current} / ${max}`}
      </div>
    </div>;
};

export default function PaymentDetails() {
  const { userID } = useAuth();
  const { 
    bankDetails, 
    stats, 
    devices, 
    loading, 
    error, 
    refetch, 
    addDevice, 
    updateDevice, 
    deleteDevice,
    fetchDevices // Добавляем получение функции
  } = useBankDetails();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<BankDetail | null>(null);
  const [banks, setBanks] = useState<Array<{code: string; name: string; nspkCode: string}>>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  
  // Devices state
  const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [currentQrDevice, setCurrentQrDevice] = useState<string>("");
  const [deviceFormData, setDeviceFormData] = useState({
    name: "",
    status: "active"
  });
  const [deviceErrors, setDeviceErrors] = useState<{[key: string]: string}>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Form state
  const [formData, setFormData] = useState({
    currency: "RUB",
    payment_system: "",
    bank_name: "",
    bank_code: "",
    card_number: "",
    phone: "",
    owner: "",
    min_amount: "",
    max_amount: "",
    max_amount_day: "",
    max_amount_month: "",
    max_quantity_day: "",
    max_quantity_month: "",
    max_orders_simultaneosly: "",
    delay: "",
    device_id: "unattached",
    enabled: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formLoading, setFormLoading] = useState(false);

  const fetchBanks = async () => {
    setBanksLoading(true);
    setBanksError(null);
    try {
      const response = await apiClient.get('/merchant/banks');
      setBanks(response.data);
    } catch (error: any) {
      console.error("Ошибка при загрузке банков:", error);
      setBanksError(error.response?.data?.message || "Не удалось загрузить список банков");
      toast({
        title: "Ошибка загрузки банков",
        description: "Не удалось загрузить список банков",
        variant: "destructive"
      });
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);
  
  // Filter state
  const [filters, setFilters] = useState({
    currency: "all",
    paymentMethod: "all", 
    paymentType: "all",
    status: "all"
  });

  const handleBankChange = (bankCode: string) => {
    const selectedBank = banks.find(bank => bank.code === bankCode);
    if (selectedBank) {
      setFormData(prev => ({
        ...prev,
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
        nspk_code: selectedBank.nspkCode
      }));
    }
  };

  // Функции для работы с устройствами
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleDeviceInputChange = (field: string, value: string) => {
    setDeviceFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateDeviceForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!deviceFormData.name.trim()) newErrors.name = "Укажите название устройства";
    
    setDeviceErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeviceEdit = (device: any) => {
    setEditingDeviceId(device.deviceId);
    setDeviceFormData({
      name: device.deviceName,
      status: device.enabled ? "active" : "inactive"
    });
    setDeviceErrors({});
  };

  // Обновляем функцию handleDeviceDelete
  const handleDeviceDelete = async (id: string) => {
    try {
      await deleteDevice(id);
      toast({
        title: "Устройство удалено",
        description: "Устройство было успешно удалено из системы",
      });
    } catch (error: any) {
      console.error("Ошибка при удалении устройства:", error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось удалить устройство",
        variant: "destructive"
      });
    }
  };

  const resetDeviceForm = () => {
    setDeviceFormData({
      name: "",
      status: "active"
    });
    setEditingDeviceId(null);
    setDeviceErrors({});
  };

  // Обновляем функцию handleDeviceSave
  const handleDeviceSave = async () => {
    if (!validateDeviceForm()) {
      toast({
        title: "Ошибка",
        description: "Исправьте ошибки в форме",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingDeviceId) {
        // Редактирование существующего устройства
        await updateDevice(editingDeviceId, {
          deviceName: deviceFormData.name,
          enabled: deviceFormData.status === "active"
        });

        toast({
          title: "Устройство обновлено",
          description: "Устройство было успешно обновлено",
        });
      } else {
        // Создание нового устройства
        await addDevice({
          deviceName: deviceFormData.name,
          enabled: deviceFormData.status === "active"
        });

        toast({
          title: "Устройство добавлено",
          description: "Новое устройство было успешно добавлено",
        });
      }

      resetDeviceForm();
    } catch (error: any) {
      console.error("Ошибка при сохранении устройства:", error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось сохранить устройство",
        variant: "destructive"
      });
    }
  };

  const handleShowQrCode = (device: any) => {
    setCurrentQrDevice(device.deviceName);
    setQrDialogOpen(true);
  };

  // Функции для работы с реквизитами
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '').replace(/^7/, '+7');
  };

  const formatPhoneForBackend = (phone: string): string => {
    // Убираем все нецифровые символы
    const cleaned = phone.replace(/\D/g, '');
    
    // Если номер начинается с +7, заменяем на 8
    if (cleaned.startsWith('7')) {
      return '8' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.bank_name) newErrors.bank_name = "Выберите банк";
    if (!formData.owner.trim()) newErrors.owner = "Укажите имя владельца";
    if (!formData.currency) newErrors.currency = "Выберите валюту";
    if (!formData.payment_system) newErrors.payment_system = "Выберите способ оплаты";
    // Валидация для задержки
    if (formData.delay) {
      const delayValue = Number(formData.delay);
      if (isNaN(delayValue) || delayValue < 0) {
        newErrors.delay = "Введите положительное число";
      }
    }
    // Валидация устройства
    if (formData.device_id && formData.device_id !== "unattached" && !devices.some(device => device.deviceId === formData.device_id)) {
      newErrors.device_id = "Выбрано несуществующее устройство";
    }
    
    // Валидация номера карты/телефона в зависимости от способа оплаты
    if (formData.payment_system === "C2C") {
      const cleanedCardNumber = formData.card_number.replace(/\s/g, '');
      if (!cleanedCardNumber) {
        newErrors.card_number = "Укажите номер карты";
      } else if (cleanedCardNumber.length !== 16) {
        newErrors.card_number = "Номер карты должен содержать 16 цифр";
      }

    } else if (formData.payment_system === "SBP") {
      const cleanedPhone = formatPhoneForBackend(formData.phone);
      if (!cleanedPhone) {
        newErrors.phone = "Укажите номер телефона";
      } else if (!/^8\d{10}$/.test(cleanedPhone)) {
        newErrors.phone = "Неверный формат телефона (8XXXXXXXXXX)";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик сохранения формы
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Ошибка",
        description: "Исправьте ошибки в форме",
        variant: "destructive"
      });
      return;
    }
  
    setFormLoading(true);
    
    try {
      // Подготовка данных для отправки
      const formDataToSend = {
        ...formData,
        phone: formData.phone ? formatPhoneForBackend(formData.phone) : "",
        card_number: formData.card_number ? formData.card_number.replace(/\s/g, '') : "",
        device_id: formData.device_id === "unattached" ? "" : formData.device_id
      };
  
      if (editingId) {
        await bankService.updateBankDetail({ ...formDataToSend, id: editingId });
        toast({
          title: "Реквизит обновлен",
          description: "Реквизит был успешно обновлен",
        });
      } else {
        await bankService.createBankDetail({ ...formDataToSend, trader_id: userID });
        toast({
          title: "Реквизит добавлен",
          description: "Новый реквизит был успешно добавлен",
        });
      }
      
      setDialogOpen(false);
      refetch();
      resetForm();
    } catch (error: any) {
      console.error("Ошибка при сохранении реквизита:", error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось сохранить реквизит",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Обработчик удаления реквизита
  const handleDelete = async () => {
    if (!detailToDelete) return;
    
    try {
      await bankService.deleteBankDetail(detailToDelete.id);
      toast({
        title: "Реквизит удален",
        description: "Реквизит был успешно удален",
      });
      setDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Ошибка при удалении реквизита:", error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось удалить реквизит",
        variant: "destructive"
      });
    }
  };

  // Сброс формы
  const resetForm = () => {
    setFormData({
      currency: "RUB",
      payment_system: "",
      bank_name: "",
      bank_code: "",
      card_number: "",
      phone: "",
      owner: "",
      min_amount: "",
      max_amount: "",
      max_amount_day: "",
      max_amount_month: "",
      max_quantity_day: "",
      max_quantity_month: "",
      max_orders_simultaneosly: "",
      delay: "",
      enabled: true,
      device_id: "unattached"
    });
    setEditingId(null);
    setErrors({});
  };

  // Обработчик редактирования реквизита
  const handleEdit = (detail: BankDetail) => {
    setEditingId(detail.id);
    setFormData({
      currency: detail.currency,
      payment_system: detail.payment_system,
      bank_name: detail.bank_name,
      bank_code: detail.bank_code,
      card_number: detail.card_number ? formatCardNumberDisplay(detail.card_number) : "",
      phone: detail.phone ? formatPhoneNumber(detail.phone) : "",
      owner: detail.owner,
      min_amount: detail.min_amount.toString(),
      max_amount: detail.max_amount.toString(),
      max_amount_day: detail.max_amount_day.toString(),
      max_amount_month: detail.max_amount_month.toString(),
      max_quantity_day: detail.max_quantity_day.toString(),
      max_quantity_month: detail.max_quantity_month.toString(),
      max_orders_simultaneosly: detail.max_orders_simultaneosly.toString(),
      delay: (detail.delay / 60000).toString(), // Конвертируем миллисекунды в минуты
      enabled: detail.enabled,
      device_id: detail.device_id || "unattached",
    });
    setDialogOpen(true);
  };

  // Обработчик изменения статуса реквизита
  const handleToggleStatus = async (detail: BankDetail) => {
    try {
      await bankService.updateBankDetail({
        ...detail,
        enabled: !detail.enabled
      });
      toast({
        title: "Статус изменен",
        description: "Статус реквизита был успешно изменен",
      });
      refetch();
    } catch (error: any) {
      console.error("Ошибка при изменении статуса:", error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось изменить статус",
        variant: "destructive"
      });
    }
  };

  // Фильтрация данных
  const filteredPaymentDetails = bankDetails.filter(detail => {
    if (filters.currency !== "all" && detail.currency !== filters.currency) return false;
    if (filters.paymentMethod !== "all" && detail.payment_system !== filters.paymentMethod) return false;
    if (filters.paymentType !== "all") {
      // Group payment types
      const cardTypes = ["C2C"];
      const digitalTypes = ["SBP"];
      
      if (filters.paymentType === "card" && !cardTypes.includes(detail.payment_system)) return false;
      if (filters.paymentType === "digital" && !digitalTypes.includes(detail.payment_system)) return false;
    }
    if (filters.status !== "all") {
      if (filters.status === "active" && !detail.enabled) return false;
      if (filters.status === "inactive" && detail.enabled) return false;
    }
    return true;
  });

  // Пагинация
  const totalItems = filteredPaymentDetails.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredPaymentDetails.slice(startIndex, endIndex);

  // Получение статистики для конкретного реквизита
  const getDetailStats = (detailId: string) => {
    return stats.find(stat => stat.bank_detail_id === detailId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Реквизиты</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка реквизитов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Реквизиты</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Реквизиты</h1>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (open) {
              resetForm();
              setDialogOpen(true);
            } else {
              setDialogOpen(false);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Добавить реквизит
              </Button>
            </DialogTrigger>
            
            {/* Devices Dialog */}
            <Dialog open={devicesDialogOpen} onOpenChange={(open) => {
              if (!open) {
                resetDeviceForm();
                setDevicesDialogOpen(false);
              } else {
                setDevicesDialogOpen(true);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Monitor className="mr-2 h-4 w-4" />
                  Устройства
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Управление устройствами</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Devices Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                           <TableRow>
                             <TableHead>ID</TableHead>
                             <TableHead>Имя</TableHead>
                             <TableHead>Статус</TableHead>
                             <TableHead>Действия</TableHead>
                           </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.length === 0 ? (
                          <TableRow>
                             <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                               Нет добавленных устройств
                             </TableCell>
                          </TableRow>
                        ) : (
                          devices.map(device => (
                            <TableRow key={device.deviceId}>
                              <TableCell className="font-mono text-sm">#{device.deviceId}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {device.enabled ? 
                                    <Smartphone className="h-4 w-4 text-green-500" /> : 
                                    <Monitor className="h-4 w-4 text-gray-400" />
                                  }
                                  <span>{device.deviceName}</span>
                                </div>
                              </TableCell>
                               <TableCell>
                                 <Badge variant={device.enabled ? "default" : "secondary"}>
                                   {device.enabled ? "Активно" : "Неактивно"}
                                 </Badge>
                               </TableCell>
                               <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleShowQrCode(device)}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeviceEdit(device)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить устройство?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Устройство будет удалено из системы.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeviceDelete(device.deviceId)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add Device Form */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">
                      {editingDeviceId ? "Редактировать устройство" : "Добавить новое устройство"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deviceName">Название устройства*</Label>
                        <Input 
                          id="deviceName"
                          placeholder="Например: Рабочий компьютер" 
                          value={deviceFormData.name} 
                          onChange={e => handleDeviceInputChange("name", e.target.value)}
                          className={deviceErrors.name ? "border-red-500" : ""}
                        />
                        {deviceErrors.name && <span className="text-red-500 text-xs">{deviceErrors.name}</span>}
                       </div>
                       <div className="space-y-2">
                        <Label htmlFor="deviceStatus">Статус</Label>
                        <Select 
                          value={deviceFormData.status} 
                          onValueChange={value => handleDeviceInputChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Активно</SelectItem>
                            <SelectItem value="inactive">Неактивно</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      {/* <Button variant="outline" onClick={resetDeviceForm}>
                        {editingDeviceId ? "Отмена" : "Очистить"}
                      </Button> */}
                      <Button onClick={handleDeviceSave}>
                        {editingDeviceId ? "Обновить" : "Добавить устройство"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Dialog>
          
          {/* QR Code Dialog */}
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>QR-код для привязки устройства</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                 <div className="text-center">
                   <div className="bg-muted rounded-lg p-8 mb-4">
                     {/* Заглушка для генерации QR кода */}
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`device:${currentQrDevice}:${Date.now()}`)}`}
                       alt="QR код для привязки устройства"
                       className="h-32 w-32 mx-auto border rounded"
                     />
                     <div className="mt-4 space-y-2">
                       <p className="text-sm font-medium">QR-код для: {currentQrDevice}</p>
                       <div className="bg-background border rounded p-2">
                         <p className="text-xs font-mono break-all">
                           device:{currentQrDevice}:{Date.now()}
                         </p>
                       </div>
                       <p className="text-xs text-muted-foreground">
                         Строка для кодирования в QR
                       </p>
                     </div>
                   </div>
                  <p className="text-sm text-muted-foreground">
                    Отсканируйте этот QR-код с помощью приложения для привязки устройства к аккаунту.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setQrDialogOpen(false)}>
                    Закрыть
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (open) {
            resetForm();
            setDialogOpen(true);
          } else {
            setDialogOpen(false);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <div></div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Редактировать реквизит" : "Добавить новый реквизит"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта*</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={value => handleInputChange("currency", value)}
                  >
                    <SelectTrigger className={errors.currency ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currency && <span className="text-red-500 text-xs">{errors.currency}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_system">Способ оплаты*</Label>
                  <Select 
                    value={formData.payment_system} 
                    onValueChange={value => {
                      handleInputChange("payment_system", value);
                      // Clear phone/card when changing payment method
                      handleInputChange("phone", "");
                      handleInputChange("card_number", "");
                    }}
                  >
                    <SelectTrigger className={errors.payment_system ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите способ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SBP">СБП</SelectItem>
                      <SelectItem value="C2C">Карта (C2C)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.payment_system && <span className="text-red-500 text-xs">{errors.payment_system}</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Банк*</Label>
                  <Select 
                    value={formData.bank_code} 
                    onValueChange={handleBankChange}
                    disabled={banksLoading || banks.length === 0}
                  >
                    <SelectTrigger className={errors.bank_code ? "border-red-500" : ""}>
                      <SelectValue placeholder={banksLoading ? "Загрузка банков..." : "Выберите банк"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banksLoading ? (
                        <SelectItem value="loading" disabled>Загрузка банков...</SelectItem>
                      ) : banksError ? (
                        <SelectItem value="error" disabled>{banksError}</SelectItem>
                      ) : (
                        banks.map(bank => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.bank_name && <span className="text-red-500 text-xs">{errors.bank_name}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Имя владельца*</Label>
                  <Input 
                    placeholder="Например: Иван И." 
                    value={formData.owner} 
                    onChange={e => handleInputChange("owner", e.target.value)}
                    className={errors.owner ? "border-red-500" : ""}
                  />
                  {errors.owner && <span className="text-red-500 text-xs">{errors.owner}</span>}
                </div>
              </div>

              {/* Conditional phone/card field */}
              {formData.payment_system === "C2C" ? (
                  <div className="space-y-2">
                  <Label htmlFor="card_number">Номер карты*</Label>
                  <Input 
                    placeholder="0000 0000 0000 0000" 
                    value={formData.card_number} 
                    onChange={e => {
                      // Убираем все нецифровые символы
                      const value = e.target.value.replace(/\D/g, '');

                      // Ограничиваем длину (16 цифр)
                      if (value.length <= 16) {
                        // Форматируем номер для отображения (группы по 4 цифры)
                        const formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
                        handleInputChange("card_number", formattedValue);
                      }
                    }}
                    className={errors.card_number ? "border-red-500" : ""}
                    maxLength={19} // 16 цифр + 3 пробела
                  />
                  {errors.card_number && <span className="text-red-500 text-xs">{errors.card_number}</span>}
                </div>
              ) : formData.payment_system === "SBP" ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон*</Label>
                  <Input 
                    placeholder="+7 (123) 456-78-90" 
                    value={formData.phone} 
                    onChange={e => {
                      // Разрешаем ввод только цифр и знака +
                      let value = e.target.value.replace(/[^\d+]/g, '');
                      
                      // Ограничиваем длину
                      if (value.length > 12) {
                        value = value.substring(0, 12);
                      }
                      
                      // Форматируем номер для отображения
                      let formattedValue = value;
                      if (value.startsWith('+7') && value.length > 2) {
                        const numbers = value.substring(2).replace(/\D/g, '');
                        formattedValue = `+7 (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}-${numbers.substring(6, 8)}-${numbers.substring(8, 10)}`;
                      } else if (value.startsWith('8') && value.length > 1) {
                        const numbers = value.substring(1).replace(/\D/g, '');
                        formattedValue = `+7 (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}-${numbers.substring(6, 8)}-${numbers.substring(8, 10)}`;
                      }
                      
                      handleInputChange("phone", formattedValue);
                    }}
                    className={errors.phone ? "border-red-500" : ""}
                    maxLength={18}
                  />
                  {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                </div>
              ) : null}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Лимиты</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Мин сумма сделки</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="0"
                      value={formData.min_amount} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("min_amount", value);
                        }
                      }}
                      className={errors.min_amount ? "border-red-500" : ""}
                    />
                    {errors.min_amount && <span className="text-red-500 text-xs">{errors.min_amount}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Макс сумма сделки</Label>
                    <Input 
                      type="number" 
                      placeholder="1000000" 
                      min="0"
                      value={formData.max_amount} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_amount", value);
                        }
                      }}
                      className={errors.max_amount ? "border-red-500" : ""}
                    />
                    {errors.max_amount && <span className="text-red-500 text-xs">{errors.max_amount}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Сумма (день)</Label>
                    <Input 
                      type="number" 
                      placeholder="1000000" 
                      min="0"
                      value={formData.max_amount_day} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_amount_day", value);
                        }
                      }}
                      className={errors.max_amount_day ? "border-red-500" : ""}
                    />
                    {errors.max_amount_day && <span className="text-red-500 text-xs">{errors.max_amount_day}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Сумма (месяц)</Label>
                    <Input 
                      type="number" 
                      placeholder="30000000" 
                      min="0"
                      value={formData.max_amount_month} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_amount_month", value);
                        }
                      }}
                      className={errors.max_amount_month ? "border-red-500" : ""}
                    />
                    {errors.max_amount_month && <span className="text-red-500 text-xs">{errors.max_amount_month}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Макс кол-во сделок (день)</Label>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      min="1"
                      value={formData.max_quantity_day} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_quantity_day", value);
                        }
                      }}
                      className={errors.max_quantity_day ? "border-red-500" : ""}
                    />
                    {errors.max_quantity_day && <span className="text-red-500 text-xs">{errors.max_quantity_day}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Макс кол-во сделок (месяц)</Label>
                    <Input 
                      type="number" 
                      placeholder="300" 
                      min="1"
                      value={formData.max_quantity_month} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_quantity_month", value);
                        }
                      }}
                      className={errors.max_quantity_month ? "border-red-500" : ""}
                    />
                    {errors.max_quantity_month && <span className="text-red-500 text-xs">{errors.max_quantity_month}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Сделок одновременно</Label>
                    <Input 
                      type="number" 
                      placeholder="2" 
                      min="1"
                      value={formData.max_orders_simultaneosly} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("max_orders_simultaneosly", value);
                        }
                      }}
                      className={errors.max_orders_simultaneosly ? "border-red-500" : ""}
                    />
                    {errors.max_orders_simultaneosly && <span className="text-red-500 text-xs">{errors.max_orders_simultaneosly}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Задержка между сделками (мин)</Label>
                    <Input 
                      type="number" 
                      placeholder="5" 
                      min="0"
                      value={formData.delay} 
                      onChange={e => {
                        const value = e.target.value;
                        // Разрешаем только положительные числа
                        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                          handleInputChange("delay", value);
                        }
                      }}
                      className={errors.delay ? "border-red-500" : ""}
                    />
                    {errors.delay && <span className="text-red-500 text-xs">{errors.delay}</span>}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Устройства</h4>
                <div className="space-y-2">
                  <Label htmlFor="device">Привязанное устройство</Label>
                  <Select 
                    value={formData.device_id} 
                    onValueChange={value => handleInputChange("device_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите устройство (необязательно)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unattached">Не привязано</SelectItem>
                      {devices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.deviceName} ({device.enabled ? "Активно" : "Неактивно"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Привяжите устройство для дополнительной безопасности операций
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch 
                  id="enabled" 
                  checked={formData.enabled} 
                  onCheckedChange={value => handleInputChange("enabled", value)} 
                />
                <Label htmlFor="enabled">Активность</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={formLoading}>
                  {formLoading ? "Сохранение..." : (editingId ? "Обновить" : "Сохранить")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Валюта</Label>
            <Select 
              value={filters.currency} 
              onValueChange={(value) => handleFilterChange("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все валюты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все валюты</SelectItem>
                <SelectItem value="RUB">RUB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Способ оплаты</Label>
            <Select 
              value={filters.paymentMethod} 
              onValueChange={(value) => handleFilterChange("paymentMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все способы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все способы</SelectItem>
                <SelectItem value="SBP">СБП</SelectItem>
                <SelectItem value="C2C">Карта</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Тип оплаты</Label>
            <Select 
              value={filters.paymentType} 
              onValueChange={(value) => handleFilterChange("paymentType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="digital">Цифровые</SelectItem>
                <SelectItem value="card">Карточные</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="inactive">Отключён</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Reset filters button */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setFilters({
                currency: "all",
                paymentMethod: "all",
                paymentType: "all", 
                status: "all"
              });
              setCurrentPage(1);
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>

      {/* Payment Details Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Устройства</TableHead>
              <TableHead className="w-[200px]">Реквизиты</TableHead>
              <TableHead className="w-[150px]">Лимиты</TableHead>
              <TableHead className="w-[80px]">Одновременно</TableHead>
              <TableHead className="w-[200px]">По количеству</TableHead>
              <TableHead className="w-[200px]">По объёму</TableHead>
              <TableHead className="w-[100px]">Статус</TableHead>
              <TableHead className="w-[120px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            ) : (
              currentData.map(detail => {
                const detailStats = getDetailStats(detail.id);
                const device = devices.find(d => d.deviceId === detail.device_id);
                
                return (
                  <TableRow key={detail.id}>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="font-medium">{device?.deviceName || "Не назначено"}</div>
                        <div className="text-muted-foreground font-mono">#{detail.device_id || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {detail.payment_system === "SBP" ? "СБП" : "Карта"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{detail.currency}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{detail.bank_name}</span>
                        </div>
                        {detail.phone && detail.payment_system === "SBP" && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatPhoneNumber(detail.phone)}</span>
                          </div>
                        )}
                        {detail.card_number && detail.payment_system === "C2C" && (
                          <div className="text-xs text-muted-foreground">
                            {formatCardNumber(detail.card_number)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {detail.owner}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="text-muted-foreground">
                          от {detail.min_amount.toLocaleString()} {detail.currency}
                        </div>
                        <div className="text-muted-foreground">
                          до {detail.max_amount.toLocaleString()} {detail.currency}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{detail.max_orders_simultaneosly}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <ProgressBar 
                            current={detailStats?.current_count_today || 0} 
                            max={detail.max_quantity_day} 
                            percentage={detailStats && detail.max_quantity_day > 0 
                              ? Math.min(100, (detailStats.current_count_today / detail.max_quantity_day) * 100)
                              : 0
                            }
                            type="deals" 
                            label="День (сделки)" 
                          />
                        </div>
                        <div className="space-y-1">
                          <ProgressBar 
                            current={detailStats?.current_count_month || 0} 
                            max={detail.max_quantity_month} 
                            percentage={detailStats && detail.max_quantity_month > 0 
                              ? Math.min(100, (detailStats.current_count_month / detail.max_quantity_month) * 100)
                              : 0
                            }
                            type="deals" 
                            label="Месяц (сделки)" 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <ProgressBar 
                            current={detailStats?.current_amount_today || 0} 
                            max={detail.max_amount_day} 
                            percentage={detailStats && detail.max_amount_day > 0 
                              ? Math.min(100, (detailStats.current_amount_today / detail.max_amount_day) * 100)
                              : 0
                            }
                            type="amount" 
                            label="День (сумма)" 
                          />
                        </div>
                        <div className="space-y-1">
                          <ProgressBar 
                            current={detailStats?.current_amount_month || 0} 
                            max={detail.max_amount_month} 
                            percentage={detailStats && detail.max_amount_month > 0 
                              ? Math.min(100, (detailStats.current_amount_month / detail.max_amount_month) * 100)
                              : 0
                            }
                            type="amount" 
                            label="Месяц (сумма)" 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-2">
                        <Switch 
                          checked={detail.enabled} 
                          onCheckedChange={() => handleToggleStatus(detail)}
                        />
                        <span className={`text-xs px-2 py-1 rounded-full ${detail.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {detail.enabled ? "Активен" : "Неактивен"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          onClick={() => handleEdit(detail)}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Изменить
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-8 text-xs"
                              onClick={() => {
                                setDetailToDelete(detail);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Удалить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Реквизит будет удален из системы навсегда.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Нет</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Да
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Реквизит будет удален из системы навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Пагинация */}
      {filteredPaymentDetails.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Показать:</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              записей на странице
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Вперед
              </Button>
            </div>
          </div>
        </div>
      )}

      {bankDetails.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            У вас пока нет добавленных реквизитов
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить первый реквизит
          </Button>
        </div>
      )}
    </div>
  );
}