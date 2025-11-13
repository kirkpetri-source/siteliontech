import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWhatsAppNotification } from "@/hooks/useWhatsAppNotification";

interface Quote {
  id: string;
  service_name: string | null;
  customer_name: string;
  customer_phone: string;
  customer_contact: string | null;
  details: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Solicitado' },
  { value: 'in_progress', label: 'Em análise' },
  { value: 'ready', label: 'Pronto' },
  { value: 'sent', label: 'Enviado ao cliente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Reprovado' },
];

export const QuotesManager = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendNotification } = useWhatsAppNotification();

  const loadQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setQuotes((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const updateStatus = async (quote: Quote, status: string) => {
    await supabase
      .from('quotes' as any)
      .update({ status })
      .eq('id', quote.id);

    setQuotes((prev) => prev.map((q) => q.id === quote.id ? { ...q, status } : q));

    // Send WhatsApp notification to customer when ready or sent
    if (status === 'ready' || status === 'sent' || status === 'approved' || status === 'rejected') {
      const textMap: Record<string, string> = {
        ready: `🦁 Lion Tech\n\nSeu orçamento para "${quote.service_name}" está pronto. Responda por aqui para visualizar ou tirar dúvidas.`,
        sent: `🦁 Lion Tech\n\nAcabamos de enviar seu orçamento de "${quote.service_name}". Qualquer dúvida, estamos à disposição.`,
        approved: `🦁 Lion Tech\n\nObrigado! Seu orçamento foi aprovado. Daremos sequência no atendimento.`,
        rejected: `🦁 Lion Tech\n\nEntendido! Seu orçamento foi marcado como reprovado. Se mudar de ideia, estamos por aqui.`,
      };

      await sendNotification({
        phoneNumber: quote.customer_phone,
        message: textMap[status],
        messageType: 'custom',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 text-center">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.id.slice(0,8)}</TableCell>
                  <TableCell>{q.customer_name}</TableCell>
                  <TableCell>{q.service_name}</TableCell>
                  <TableCell>
                    {q.customer_phone}
                    {q.customer_contact ? ` • ${q.customer_contact}` : ''}
                  </TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v) => updateStatus(q, v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(q.created_at).toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};