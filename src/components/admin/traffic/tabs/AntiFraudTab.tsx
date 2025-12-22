import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Settings, Trash2 } from "lucide-react";
import { AntiFraudRule } from "../types";

interface AntiFraudTabProps {
  antiFraudRules: AntiFraudRule[];
  actionLoading: string | null;
  onCreateRule: () => void;
  onToggleRule: (ruleId: string, currentStatus: boolean) => void;
  onViewRuleDetails: (rule: AntiFraudRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

export default function AntiFraudTab({
  antiFraudRules,
  actionLoading,
  onCreateRule,
  onToggleRule,
  onViewRuleDetails,
  onDeleteRule
}: AntiFraudTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Правила антифрода
          </CardTitle>
          <Button onClick={onCreateRule}>
            <Plus className="mr-2 h-4 w-4" />
            Создать правило
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {antiFraudRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет правил антифрода
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {antiFraudRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.type}</Badge>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Активно" : "Неактивно"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => onToggleRule(rule.id, rule.is_active)}
                        disabled={actionLoading === `rule-toggle-${rule.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRuleDetails(rule)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteRule(rule.id)}
                        disabled={actionLoading === `delete-rule-${rule.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}