import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

interface BusinessHour {
  id: string;
  day_of_week: number;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
}

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const BusinessHoursManager = () => {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");

      if (error) throw error;

      setHours(data || []);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      toast.error("Erro ao carregar horários de funcionamento");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number, enabled: boolean) => {
    setHours((prev) =>
      prev.map((hour) =>
        hour.day_of_week === dayOfWeek
          ? { ...hour, is_enabled: enabled }
          : hour
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((hour) =>
        hour.day_of_week === dayOfWeek ? { ...hour, [field]: value } : hour
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const hour of hours) {
        const { error } = await supabase
          .from("business_hours")
          .update({
            is_enabled: hour.is_enabled,
            start_time: hour.start_time,
            end_time: hour.end_time,
          })
          .eq("day_of_week", hour.day_of_week);

        if (error) throw error;
      }

      toast.success("Horários atualizados com sucesso!");
    } catch (error) {
      console.error("Error saving business hours:", error);
      toast.error("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Horário de Funcionamento</h2>
            <p className="text-sm text-muted-foreground">
              Configure quando o chat estará disponível
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {hours.map((hour) => (
            <div
              key={hour.day_of_week}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2 w-40">
                <Switch
                  checked={hour.is_enabled}
                  onCheckedChange={(checked) =>
                    handleToggleDay(hour.day_of_week, checked)
                  }
                />
                <Label className="font-medium">
                  {dayNames[hour.day_of_week]}
                </Label>
              </div>

              {hour.is_enabled ? (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Abertura:
                    </Label>
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) =>
                        handleTimeChange(
                          hour.day_of_week,
                          "start_time",
                          e.target.value
                        )
                      }
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Fechamento:
                    </Label>
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) =>
                        handleTimeChange(
                          hour.day_of_week,
                          "end_time",
                          e.target.value
                        )
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Como funciona:</strong> Quando estiver dentro do horário de
          funcionamento, o chat mostrará o leão com balãozinho e status "🟢
          Atendendo agora". Fora do horário, mostrará o leão dormindo e status
          "🔴 Fora do expediente".
        </p>
      </Card>
    </div>
  );
};
