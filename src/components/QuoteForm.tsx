import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useWhatsAppNotification } from "@/hooks/useWhatsAppNotification";

interface QuoteFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
  service: {
    id?: string;
    name: string;
    description?: string | null;
    categoryName?: string | null;
    benefits?: string[];
    prerequisites?: string[];
  };
}

export const QuoteForm = ({ open, onClose, onSuccess, service }: QuoteFormProps) => {
  const { requestQuote } = useWhatsAppNotification();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!name || !phone) {
        setError("Nome e telefone são obrigatórios.");
        setLoading(false);
        return;
      }

      const result = await requestQuote({
        serviceId: service.id,
        serviceName: service.name,
        categoryName: service.categoryName || undefined,
        serviceDescription: service.description || undefined,
        benefits: service.benefits || [],
        prerequisites: service.prerequisites || [],
        customerName: name,
        customerPhone: phone,
        customerContact: contact || undefined,
        details: details || undefined,
      });

      const successMsg = "Solicitação enviada com sucesso! Você receberá confirmação no WhatsApp.";
      setSuccess(successMsg);
      // Notifica o componente pai para fechar o modal e exibir confirmação
      onSuccess?.(successMsg);
      setLoading(false);
    } catch (e: any) {
      setError("Falha ao enviar solicitação. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Orçamento</DialogTitle>
          <DialogDescription>
            Informe seus dados e descreva brevemente o problema. Entraremos em contato pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Serviço selecionado: <span className="font-medium">{service.name}</span>
            {service.categoryName ? ` • ${service.categoryName}` : ""}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="DDD + número" />
            </div>
          </div>

          <div>
            <Label htmlFor="contact">Contato alternativo (e-mail)</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="seu@email.com" />
          </div>

          <div>
            <Label htmlFor="details">Detalhes do serviço</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Descreva brevemente sua necessidade" />
          </div>

          {success && <div className="text-green-600 text-sm">{success}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Enviar pelo WhatsApp"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};