import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import chatLionIcon from "@/assets/chat-lion-icon.png";
import chatLionSleeping from "@/assets/chat-lion-sleeping.png";
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
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [ticketMeta, setTicketMeta] = useState<any | null>(null);
  const [autoResponses, setAutoResponses] = useState({
    offline_welcome: "Olá! 👋 No momento estamos fora do horário de atendimento, mas fique tranquilo! Registramos sua mensagem e responderemos assim que possível pelo WhatsApp.",
    offline_confirmation: "Recebemos sua mensagem! Nossa equipe responderá em breve durante nosso horário de atendimento.",
    online_welcome: "Olá! 👋 Sou o atendimento da Lion Tech. Como posso ajudar hoje?",
  });
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Load auto responses
  useEffect(() => {
    const loadAutoResponses = async () => {
      try {
        const { data, error } = await supabase
          .from("auto_responses")
          .select("*")
          .eq("active", true)
          .in("response_type", ["offline_welcome", "offline_confirmation", "online_welcome"]);

        if (error) throw error;

        if (data && data.length > 0) {
          const responsesMap: any = {};
          data.forEach((item) => {
            responsesMap[item.response_type] = item.message;
          });
          setAutoResponses((prev) => ({ ...prev, ...responsesMap }));
        }
      } catch (error) {
        console.error("Error loading auto responses:", error);
      }
    };

    loadAutoResponses();
  }, []);

  // Check business hours
  useEffect(() => {
    const checkBusinessHours = async () => {
      try {
        const { data, error } = await supabase
          .from("business_hours")
          .select("*")
          .order("day_of_week");

        if (error) throw error;

        if (data && data.length > 0) {
          const now = new Date();
          const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format

          const todayHours = data.find((h) => h.day_of_week === currentDay);

          if (todayHours?.is_enabled) {
            const isWithinHours =
              currentTime >= todayHours.start_time &&
              currentTime <= todayHours.end_time;
            setIsOnline(isWithinHours);
          } else {
            setIsOnline(false);
          }
        }
      } catch (error) {
        console.error("Error checking business hours:", error);
        setIsOnline(false);
      }
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Subscrição em tempo real para mensagens do ticket corrente (incrementa badge)
  useEffect(() => {
    const storedTicketId = localStorage.getItem("chat_ticket_id");
    if (!storedTicketId) return;
    setActiveTicketId(storedTicketId);

    const channel = supabase
      .channel(`chat-ticket-${storedTicketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `ticket_id=eq.${storedTicketId}`,
      }, (payload: any) => {
        const msg = payload?.new;
        if (msg && msg.sender !== 'user') {
          setUnreadCount((c) => c + 1);
        }
        if (msg) {
          setChatMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  // Load existing messages and ticket metadata when activeTicketId is set
  useEffect(() => {
    const loadTicketData = async () => {
      if (!activeTicketId) return;
      try {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('ticket_id', activeTicketId)
          .order('sent_at', { ascending: true });
        setChatMessages(msgs || []);

        const { data: ticket } = await supabase
          .from('chat_tickets')
          .select('id, subject, page_url, attachment_url')
          .eq('id', activeTicketId)
          .single();
        setTicketMeta(ticket || null);
      } catch (err) {
        console.error('Erro ao carregar conversa:', err);
      }
    };
    loadTicketData();
  }, [activeTicketId]);

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

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push('Informe seu nome.');
    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone.length < 10 || rawPhone.length > 11) errors.push('Informe um WhatsApp válido com DDD.');
    if (!formData.subject.trim()) errors.push('Selecione um assunto.');
    if (!formData.message.trim() || formData.message.trim().length < 3) errors.push('Escreva uma mensagem (mín. 3 caracteres).');
    if (!formData.lgpdConsent) errors.push('É necessário aceitar a LGPD para prosseguir.');
    if (attachment) {
      const maxBytes = 8 * 1024 * 1024; // 8MB
      const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg'];
      if (attachment.size > maxBytes) errors.push('Anexo acima de 8MB.');
      if (!allowed.includes(attachment.type)) errors.push('Tipo de arquivo não suportado.');
    }
    if (errors.length) {
      toast.error(errors.join('\n'));
      return false;
    }
    return true;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    // Deve ter 11 dígitos: DDD (2) + 9 + número (8)
    return numbers.length === 11;
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

    if (!validatePhone(formData.phone)) {
      toast.error("Telefone inválido. Use o formato (DD) 9XXXX-XXXX");
      return;
    }

    const phoneWithCountryCode = "55" + formData.phone.replace(/\D/g, "");

    setIsSubmitting(true);

    try {
      // Criar ticket com id gerado no cliente para evitar SELECT sob RLS
      const ticketId = crypto.randomUUID();
      const { error: ticketError } = await supabase
        .from("chat_tickets")
        .insert({
          id: ticketId,
          customer_name: formData.name,
          customer_phone: phoneWithCountryCode,
          subject: formData.subject,
          initial_message: formData.message,
          page_url: window.location.href,
          lgpd_consent: formData.lgpdConsent,
          status: "new",
        });

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

      // Validação antes de enviar
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Backoff de envio com registro de tentativas
      let success = false;
      let lastErrorMessage: string | null = null;
      const delays = [0, 2000, 5000];
      for (let i = 0; i < delays.length; i++) {
        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          "send-chat-message",
          {
            body: {
              ticketId: ticketId,
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

        if (sendError || !sendResult?.success) {
          lastErrorMessage = sendError?.message || sendResult?.error || 'Falha ao enviar';
          if (i < delays.length - 1) {
            await new Promise((r) => setTimeout(r, delays[i + 1]));
            continue;
          }
        } else {
          success = true;
          break;
        }
      }

      if (success) {
        const confirmationMsg = isOnline 
          ? "Recebemos sua mensagem! Já te respondemos pelo WhatsApp."
          : autoResponses.offline_confirmation;
        toast.success(confirmationMsg);
        setStep("chat");
        
        // Salvar no localStorage
        localStorage.setItem("chat_ticket_id", ticketId);
        localStorage.setItem("chat_ticket_created", new Date().toISOString());
        setActiveTicketId(ticketId);
      } else {
        // Fallback: notificar atendente com assunto + mensagem e confirmar ao cliente
        try {
          // Confirmar ao cliente via welcome, caso a função principal esteja com instabilidade
          const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              phoneNumber: phoneWithCountryCode,
              message: '',
              messageType: 'welcome',
              additionalData: {
                customerName: formData.name,
                customerPhone: formData.phone,
              },
            },
          });

          if (!whatsappError) {
            toast.success("Estamos com instabilidade no atendimento. Enviamos uma confirmação pelo WhatsApp e responderemos em breve.");
            setStep("chat");
            localStorage.setItem("chat_ticket_id", ticketId);
            localStorage.setItem("chat_ticket_created", new Date().toISOString());
            setActiveTicketId(ticketId);
          } else {
            toast.error(`Não foi possível enviar sua mensagem. ${lastErrorMessage ? `Detalhe: ${lastErrorMessage}` : ''}`);
          }
        } catch (fallbackErr) {
          toast.error(`Não foi possível enviar sua mensagem. ${lastErrorMessage ? `Detalhe: ${lastErrorMessage}` : ''}`);
        }
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
      return autoResponses.online_welcome;
    }
    return autoResponses.offline_welcome;
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-20 w-20 hover:scale-110 transition-transform duration-300 bg-transparent p-0 border-0 cursor-pointer flex items-center justify-center group"
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary" />
        ) : (
          <>
            <img 
              src={isOnline ? chatLionIcon : chatLionSleeping} 
              alt="Lion Tech Chat" 
              className="h-20 w-20 object-contain group-hover:scale-105 transition-transform"
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
              <div className="py-2">
                <h4 className="font-semibold mb-2">Conversa</h4>
                {ticketMeta?.attachment_url && (
                  <div className="text-xs mb-2">
                    Anexo enviado: <a className="underline" href={ticketMeta.attachment_url} target="_blank" rel="noreferrer">arquivo</a>
                  </div>
                )}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-xl px-3 py-2 text-sm shadow ${m.sender === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div>{m.message}</div>
                        <div className="text-[10px] opacity-70 mt-1">{new Date(m.sent_at).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem mensagens ainda. Aguarde nosso retorno por aqui.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
