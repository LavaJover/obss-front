// tabs/TeamsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

// Типы для данных
interface User {
  id: string;
  username: string;
  login: string;
  role: string;
}

interface TeamRelation {
  id: string;
  teamLeadId: string;
  traderId: string;
  teamRelationRarams: {
    commission: number;
    created_at: string;
  };
}

export default function TeamsTab() {
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [traders, setTraders] = useState<User[]>([]);
  const [relations, setRelations] = useState<TeamRelation[]>([]);
  const [selectedTeamLead, setSelectedTeamLead] = useState('');
  const [newRelation, setNewRelation] = useState({
    traderId: '',
    commission: 0
  });
  const [editRelation, setEditRelation] = useState<TeamRelation | null>(null);
  const [editCommission, setEditCommission] = useState('');
  const [loading, setLoading] = useState({
    teamLeads: true,
    traders: true,
    relations: false,
    action: false
  });
  const [error, setError] = useState('');

  // Загрузка тим-лидов
  useEffect(() => {
    const fetchTeamLeads = async () => {
      try {
        const response = await apiClient.get<{ users: User[] }>('/admin/users?role=TEAM_LEAD');
        setTeamLeads(response.data.users || []);
      } catch (err) {
        setError('Ошибка при загрузке тим-лидов');
        console.error(err);
      } finally {
        setLoading(prev => ({ ...prev, teamLeads: false }));
      }
    };

    fetchTeamLeads();
  }, []);

  // Загрузка трейдеров
  useEffect(() => {
    const fetchTraders = async () => {
      try {
        const response = await apiClient.get<{ users: User[] }>('/admin/users?role=TRADER');
        setTraders(response.data.users || []);
      } catch (err) {
        setError('Ошибка при загрузке трейдеров');
        console.error(err);
      } finally {
        setLoading(prev => ({ ...prev, traders: false }));
      }
    };

    fetchTraders();
  }, []);

  // Загрузка отношений при выборе тим-лида
  useEffect(() => {
    const fetchRelations = async () => {
      if (!selectedTeamLead) return;
      
      try {
        setLoading(prev => ({ ...prev, relations: true }));
        const response = await apiClient.get<{ teamRelations: TeamRelation[] }>(
          `/admin/teams/relations/team-lead/${selectedTeamLead}`
        );
        setRelations(response.data.teamRelations || []);
      } catch (err) {
        setError('Ошибка при загрузке команд');
        console.error(err);
      } finally {
        setLoading(prev => ({ ...prev, relations: false }));
      }
    };

    fetchRelations();
  }, [selectedTeamLead]);

  // Получение имени пользователя по ID
  const getUserName = (userId: string) => {
    const user = [...teamLeads, ...traders].find(u => u.id === userId);
    return user ? user.username : 'Неизвестный';
  };

  // Получение логина пользователя по ID
  const getUserLogin = (userId: string) => {
    const user = [...teamLeads, ...traders].find(u => u.id === userId);
    return user ? user.login : 'неизвестно';
  };

  // Форматирование комиссии: преобразование в проценты
  const formatCommission = (commissionValue: number) => {
    // Если значение уже в процентах (>1), возвращаем как есть
    if (commissionValue > 1) {
      return commissionValue.toFixed(1) + '%';
    }
    // Преобразуем долю в проценты
    return (commissionValue * 100).toFixed(1) + '%';
  };

  // Создание нового отношения
  const handleCreateRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRelation.traderId) {
      toast({
        title: "Ошибка",
        description: "Выберите трейдера",
        variant: "destructive",
      });
      return;
    }

    // Валидация: комиссия должна быть между 0 и 1
    if (newRelation.commission < 0 || newRelation.commission > 1) {
      toast({
        title: "Ошибка",
        description: "Комиссия должна быть в диапазоне от 0 до 1",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Отправляем долю без преобразования
      await apiClient.post('/admin/teams/relations/create', {
        teamLeadId: selectedTeamLead,
        teamRelationParams: { commission: newRelation.commission },
        traderId: newRelation.traderId
      });

      // Обновляем список отношений
      const response = await apiClient.get<{ teamRelations: TeamRelation[] }>(
        `/admin/teams/relations/team-lead/${selectedTeamLead}`
      );
      setRelations(response.data.teamRelations || []);
      
      // Сбрасываем форму
      setNewRelation({ traderId: '', commission: 0 });
      setError('');
      
      toast({
        title: "Успех",
        description: "Команда успешно создана",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      toast({
        title: "Ошибка",
        description: `Ошибка при создании команды: ${errorMessage}`,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Обновление отношения
  const handleUpdateRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editRelation) return;

    const commissionValue = parseFloat(editCommission);
    
    // Валидация: комиссия должна быть между 0 и 1
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 1) {
      toast({
        title: "Ошибка",
        description: "Комиссия должна быть в диапазоне от 0 до 1",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Отправляем долю без преобразования
      await apiClient.patch('/admin/teams/relations/update', {
        relationId: editRelation.id,
        teamRelationParams: { commission: commissionValue }
      });

      // Обновляем локальное состояние
      setRelations(relations.map(rel => 
        rel.id === editRelation.id 
          ? { 
              ...rel, 
              teamRelationRarams: { ...rel.teamRelationRarams, commission: commissionValue } 
            } 
          : rel
      ));
      
      setEditRelation(null);
      setEditCommission('');
      setError('');
      
      toast({
        title: "Успех",
        description: "Комиссия успешно обновлена",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      toast({
        title: "Ошибка",
        description: `Ошибка при обновлении отношения: ${errorMessage}`,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Удаление отношения
  const handleDeleteRelation = async (relationId: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiClient.delete(`/admin/teams/relations/${relationId}/delete`);
      setRelations(relations.filter(rel => rel.id !== relationId));
      setError('');
      
      toast({
        title: "Успех",
        description: "Отношение успешно удалено",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      toast({
        title: "Ошибка",
        description: `Ошибка при удалении отношения: ${errorMessage}`,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Получение выбранного тим-лида
  const selectedTeamLeadData = teamLeads.find(tl => tl.id === selectedTeamLead);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Command className="h-5 w-5" />
          Управление командами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Lead Selection */}
        <div>
          <Label htmlFor="team-lead-select">Выберите тим-лида:</Label>
          <Select 
            value={selectedTeamLead} 
            onValueChange={setSelectedTeamLead}
            disabled={loading.teamLeads}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading.teamLeads ? "Загрузка..." : "-- Выберите тим-лида --"} />
            </SelectTrigger>
            <SelectContent>
              {teamLeads.map(teamLead => (
                <SelectItem key={teamLead.id} value={teamLead.id}>
                  {teamLead.username} ({teamLead.login})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading.teamLeads && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка тим-лидов...
            </div>
          )}
        </div>

        {selectedTeamLead && (
          <>
            {/* Relationships Display */}
            <div>
              <p className="text-sm font-medium mb-4">
                Отношения для: {selectedTeamLeadData?.username || 'Неизвестный тим-лид'}
              </p>
            </div>

            {/* Current Teams */}
            <div>
              <h3 className="text-lg font-medium mb-4">Текущие команды</h3>
              <div className="border rounded-lg">
                {loading.relations ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Загрузка команд...
                  </div>
                ) : relations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет активных команд
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Трейдер</TableHead>
                        <TableHead>Комиссия</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relations.map(relation => (
                        <TableRow key={relation.id}>
                          <TableCell>{getUserName(relation.traderId)}</TableCell>
                          <TableCell>
                            {editRelation?.id === relation.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editCommission}
                                  onChange={(e) => setEditCommission(e.target.value)}
                                  step="0.001"
                                  min="0"
                                  max="1"
                                  className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">доля</span>
                              </div>
                            ) : (
                              formatCommission(relation.teamRelationRarams.commission)
                            )}
                          </TableCell>
                          <TableCell>
                            {editRelation?.id === relation.id ? (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleUpdateRelation}
                                  disabled={loading.action}
                                >
                                  {loading.action ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditRelation(null);
                                    setEditCommission('');
                                  }}
                                  disabled={loading.action}
                                >
                                  Отмена
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditRelation(relation);
                                    setEditCommission(relation.teamRelationRarams.commission.toString());
                                  }}
                                  disabled={loading.action}
                                >
                                  Изменить
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteRelation(relation.id)}
                                  disabled={loading.action}
                                >
                                  {loading.action ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Create New Team */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Создать новую команду</h3>
              <form onSubmit={handleCreateRelation} className="space-y-4">
                <div>
                  <Label htmlFor="trader-select">Трейдер:</Label>
                  <Select 
                    value={newRelation.traderId} 
                    onValueChange={(value) => setNewRelation({...newRelation, traderId: value})}
                    disabled={loading.traders || loading.action}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loading.traders ? "Загрузка..." : "-- Выберите трейдера --"} />
                    </SelectTrigger>
                    <SelectContent>
                      {traders.map(trader => (
                        <SelectItem key={trader.id} value={trader.id}>
                          {trader.username} ({trader.login})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loading.traders && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Загрузка трейдеров...
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="commission-share">Комиссия (доля):</Label>
                  <Input
                    id="commission-share"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={newRelation.commission}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 1) {
                        setNewRelation({
                          ...newRelation,
                          commission: value
                        });
                      }
                    }}
                    placeholder="Введите долю от 0 до 1 (например, 0.05 = 5%)"
                    disabled={loading.action}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Введите долю от 0 до 1 (например, 0.05 = 5%)
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={loading.action || !newRelation.traderId}
                >
                  {loading.action ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Создание...
                    </>
                  ) : (
                    "Создать"
                  )}
                </Button>
              </form>
            </div>
          </>
        )}

        {!selectedTeamLead && teamLeads.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Выберите тим-лида для управления его командами
          </div>
        )}
      </CardContent>
    </Card>
  );
}