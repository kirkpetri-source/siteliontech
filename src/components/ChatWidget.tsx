import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import chatLionIcon from "@/assets/chat-lion-icon.png";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    subject: "Orçamentos",
    message: "",
    lgpdConsent: false,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check business hours
  useEffect(() => {
    const checkBusinessHours = async () => {
      try {
        const { data } = await supabase
          .from("chat_settings")
          .select("setting_value")
          .eq("setting_key", "business_hours")
          .single();

        if (data) {
          const hours = data.setting_value;
          const now = new Date();
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const day = dayNames[now.getDay()];
          const currentTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });

          const dayHours = hours[day];
          if (dayHours?.enabled) {
            const isWithinHours = currentTime >= dayHours.start && currentTime <= dayHours.end;
            setIsOnline(isWithinHours);
          } else {
            setIsOnline(false);
          }
        }
      } catch (error) {
        console.error("Error checking business hours:", error);
      }
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    return numbers.length === 11 && numbers.startsWith("55");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Use JPG, PNG ou PDF.");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      setAttachment(file);
      toast.success("Arquivo anexado com sucesso!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.message) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.lgpdConsent) {
      toast.error("Você precisa aceitar a Política de Privacidade");
      return;
    }

    const phoneWithCountryCode = "55" + formData.phone.replace(/\D/g, "");
    if (!validatePhone(phoneWithCountryCode)) {
      toast.error("Telefone inválido. Use o formato (DD) 9XXXX-XXXX");
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("chat_tickets")
        .insert({
          customer_name: formData.name,
          customer_phone: phoneWithCountryCode,
          subject: formData.subject,
          initial_message: formData.message,
          page_url: window.location.href,
          lgpd_consent: formData.lgpdConsent,
          status: "new",
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Converter anexo para base64 se existir
      let attachmentBase64 = null;
      let attachmentFileName = null;

      if (attachment) {
        const reader = new FileReader();
        attachmentBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result?.toString().split(",")[1]);
          reader.readAsDataURL(attachment);
        });
        attachmentFileName = attachment.name;
      }

      // Enviar mensagem via Evolution API
      const { data: sendResult, error: sendError } = await supabase.functions.invoke(
        "send-chat-message",
        {
          body: {
            ticketId: ticket.id,
            customerName: formData.name,
            customerPhone: phoneWithCountryCode,
            subject: formData.subject,
            message: formData.message,
            pageUrl: window.location.href,
            attachmentBase64,
            attachmentFileName,
          },
        }
      );

      if (sendError) {
        console.error("Error sending message:", sendError);
        toast.error("Erro ao enviar mensagem. Tente novamente.");
        return;
      }

      if (sendResult?.success) {
        toast.success("Recebemos sua mensagem! Já te respondemos pelo WhatsApp.");
        setStep("chat");
        
        // Salvar no localStorage
        localStorage.setItem("chat_ticket_id", ticket.id);
        localStorage.setItem("chat_ticket_created", new Date().toISOString());
      } else {
        toast.error("Não foi possível enviar sua mensagem. Tente novamente.");
      }
    } catch (error) {
      console.error("Error submitting chat:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWelcomeMessage = () => {
    if (isOnline) {
      return "Olá! 👋 Sou o atendimento da Lion Tech. Como posso ajudar hoje?";
    }
    return "Estamos fora do horário agora, mas registramos sua mensagem e responderemos assim que possível.";
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-primary to-primary/80 p-0 border-0 cursor-pointer flex items-center justify-center group"
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <>
            <img 
              src={chatLionIcon} 
              alt="Lion Tech Chat" 
              className="h-12 w-12 object-contain group-hover:scale-105 transition-transform"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Widget do chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lion Tech</h3>
                <p className="text-xs opacity-90">
                  {isOnline ? "🟢 Atendendo agora" : "🔴 Fora do expediente"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[450px] overflow-y-auto">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{getWelcomeMessage()}</p>
                  {isOnline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱️ Tempo médio de resposta: 30 minutos
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(DD) 9XXXX-XXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orçamentos">Orçamentos</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Como podemos ajudar?"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment" className="cursor-pointer flex items-center gap-2 text-sm">
                    <Paperclip className="h-4 w-4" />
                    Anexar arquivo (opcional)
                  </Label>
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="cursor-pointer"
                  />
                  {attachment && (
                    <p className="text-xs text-muted-foreground">
                      Arquivo: {attachment.name}
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="lgpd"
                    checked={formData.lgpdConsent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, lgpdConsent: checked as boolean })
                    }
                  />
                  <Label htmlFor="lgpd" className="text-xs leading-tight cursor-pointer">
                    Autorizo o uso dos meus dados para contato conforme a{" "}
                    <a href="/politicas" className="text-primary underline" target="_blank">
                      Política de Privacidade
                    </a>
                    . *
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Mensagem enviada!</h4>
                  <p className="text-sm text-muted-foreground">
                    Continue a conversa pelo WhatsApp
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
