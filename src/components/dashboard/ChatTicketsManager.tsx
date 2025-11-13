import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";

interface ChatTicket {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  subject: string;
  initial_message: string;
  page_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
}

export const ChatTicketsManager = () => {
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ChatTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  useEffect(() => {
    fetchTickets();

    // Realtime subscription
    const channel = supabase
      .channel("chat_tickets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("chat_tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Status atualizado!");
      fetchTickets();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const saveAdminNotes = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("chat_tickets")
        .update({ admin_notes: adminNotes })
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Observações salvas!");
      fetchTickets();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Erro ao salvar observações");
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["Nome", "Telefone", "Email", "Assunto", "Mensagem", "Status", "Data"].join(","),
      ...filteredTickets.map((ticket) =>
        [
          ticket.customer_name,
          ticket.customer_phone,
          ticket.customer_email || "",
          ticket.subject,
          `"${ticket.initial_message.replace(/"/g, '""')}"`,
          ticket.status,
          new Date(ticket.created_at).toLocaleDateString("pt-BR"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-tickets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "Novo", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "secondary" },
      resolved: { label: "Resolvido", variant: "outline" },
      pending_retry: { label: "Aguardando Envio", variant: "destructive" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (filterSubject !== "all" && ticket.subject !== filterSubject) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Tickets</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.new}</p>
              <p className="text-sm text-muted-foreground">Novos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Assunto</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Orçamentos">Orçamentos</SelectItem>
                <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{ticket.customer_name}</h3>
                  {getStatusBadge(ticket.status)}
                  <Badge variant="outline">{ticket.subject}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {ticket.customer_phone} {ticket.customer_email && `• ${ticket.customer_email}`}
                </p>
                <p className="text-sm mb-2">{ticket.initial_message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleString("pt-BR")}
                </p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setAdminNotes(ticket.admin_notes || "");
                    }}
                  >
                    Gerenciar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" aria-describedby="chat-ticket-dialog-desc">
                  <DialogHeader>
                    <DialogTitle>Ticket #{ticket.id.slice(0, 8)}</DialogTitle>
                  </DialogHeader>
                  <p id="chat-ticket-dialog-desc" className="sr-only">Gerenciar status e observações de um ticket de atendimento.</p>

                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Observações Internas</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={4}
                        placeholder="Adicione observações sobre este atendimento..."
                      />
                      <Button
                        onClick={() => saveAdminNotes(ticket.id)}
                        className="mt-2"
                        size="sm"
                      >
                        Salvar Observações
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Detalhes do Contato</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nome:</strong> {ticket.customer_name}</p>
                        <p><strong>Telefone:</strong> {ticket.customer_phone}</p>
                        {ticket.customer_email && (
                          <p><strong>Email:</strong> {ticket.customer_email}</p>
                        )}
                        <p><strong>Assunto:</strong> {ticket.subject}</p>
                        <p><strong>Mensagem:</strong> {ticket.initial_message}</p>
                        {ticket.page_url && (
                          <p>
                            <strong>Página:</strong>{" "}
                            <a
                              href={ticket.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              {ticket.page_url}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}

        {filteredTickets.length === 0 && (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum ticket encontrado</p>
          </Card>
        )}
      </div>
    </div>
  );
};
