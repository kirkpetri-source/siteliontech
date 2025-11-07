import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, MessageSquare, Clock, CheckCircle } from "lucide-react";

export const AutoResponsesManager = () => {
  const [responses, setResponses] = useState({
    offline_welcome: "",
    offline_confirmation: "",
    online_welcome: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("auto_responses")
        .select("*")
        .in("response_type", ["offline_welcome", "offline_confirmation", "online_welcome"]);

      if (error) throw error;

      if (data) {
        const responsesMap: any = {};
        data.forEach((item) => {
          responsesMap[item.response_type] = item.message;
        });
        setResponses(responsesMap);
      }
    } catch (error) {
      console.error("Error loading responses:", error);
      toast.error("Erro ao carregar respostas automáticas");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(responses).map(([type, message]) => ({
        response_type: type,
        message,
        active: true,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("auto_responses")
          .upsert(update, { onConflict: "response_type" });

        if (error) throw error;
      }

      toast.success("Respostas automáticas atualizadas com sucesso!");
    } catch (error) {
      console.error("Error saving responses:", error);
      toast.error("Erro ao salvar respostas automáticas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Respostas Automáticas do Chat
        </CardTitle>
        <CardDescription>
          Configure as mensagens automáticas que serão exibidas aos clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="online_welcome" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Mensagem de Boas-vindas (Online)
          </Label>
          <Textarea
            id="online_welcome"
            value={responses.online_welcome}
            onChange={(e) =>
              setResponses({ ...responses, online_welcome: e.target.value })
            }
            placeholder="Mensagem exibida quando o chat está online"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Exibida quando o atendimento está dentro do horário de expediente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="offline_welcome" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Mensagem de Boas-vindas (Offline)
          </Label>
          <Textarea
            id="offline_welcome"
            value={responses.offline_welcome}
            onChange={(e) =>
              setResponses({ ...responses, offline_welcome: e.target.value })
            }
            placeholder="Mensagem exibida quando o chat está offline"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Exibida quando o atendimento está fora do horário de expediente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="offline_confirmation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Mensagem de Confirmação (Offline)
          </Label>
          <Textarea
            id="offline_confirmation"
            value={responses.offline_confirmation}
            onChange={(e) =>
              setResponses({ ...responses, offline_confirmation: e.target.value })
            }
            placeholder="Mensagem exibida após envio fora do horário"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Exibida após o cliente enviar uma mensagem fora do horário de expediente
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
};
