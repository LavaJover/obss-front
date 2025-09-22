// tabs/TeamsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command } from "lucide-react";

export default function TeamsTab() {
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
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lightning's23 (Lightning's23)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lightning23">Lightning's23 (Lightning's23)</SelectItem>
              <SelectItem value="merchant1">Merchant 1</SelectItem>
              <SelectItem value="trader2">Trader 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Relationships Display */}
        <div>
          <p className="text-sm font-medium mb-4">Отношения для: Lightning's23</p>
        </div>

        {/* Current Teams */}
        <div>
          <h3 className="text-lg font-medium mb-4">Текущие команды</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Трейдер</TableHead>
                  <TableHead>Комиссия</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Lmanaliew_001</TableCell>
                  <TableCell>1.5%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Изменить</Button>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>leleha10</TableCell>
                  <TableCell>0.5%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Изменить</Button>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>abdusalamovm77</TableCell>
                  <TableCell>0.5%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Изменить</Button>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>adus20091</TableCell>
                  <TableCell>0.5%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Изменить</Button>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create New Team */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Создать новую команду</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="trader-select">Трейдер:</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Выберите трейдера --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trader1">Трейдер 1</SelectItem>
                  <SelectItem value="trader2">Трейдер 2</SelectItem>
                  <SelectItem value="trader3">Трейдер 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="commission-share">Комиссия (доля):</Label>
              <Input
                id="commission-share"
                type="number"
                step="0.001"
                min="0"
                max="1"
                defaultValue="0"
                placeholder="Введите долю от 0 до 1 (например, 0.05 = 5%)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Введите долю от 0 до 1 (например, 0.05 = 5%)
              </p>
            </div>
            
            <Button type="submit" className="w-full md:w-auto">
              Создать
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }