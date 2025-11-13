import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { QuoteForm } from "@/components/QuoteForm";
import { Wrench } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
interface ServiceMinimal {
  id?: string;
  name: string;
  description?: string | null;
}

const Servicos = () => {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceMinimal | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(
    "Sua solicitação foi enviada com sucesso. Você receberá confirmação pelo WhatsApp."
  );
  const location = useLocation();

  // Auto-abrir modal quando vindo da home com query param
  // Ex.: /servicos?quote=open
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("quote") === "open";
    if (shouldOpen && !quoteOpen && !selectedService) {
      setSelectedService({
        id: "generic",
        name: "Solicitação de Orçamento",
        description: "Descreva seu problema e receba um orçamento.",
      });
      setQuoteOpen(true);
    }
  }, [location.search, quoteOpen, selectedService]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-5 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Solicitação de Orçamentos e Serviços</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Resolva seu problema com agilidade
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Página dedicada para solicitar orçamento ou serviço de forma simples, rápida e direta.
            </p>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-10 text-center space-y-6 max-w-3xl mx-auto">
            <Wrench className="h-14 w-14 text-primary mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">Solicitar Orçamento</h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Clique no botão abaixo, informe seus dados básicos e descreva brevemente sua necessidade.
            </p>
            <div className="flex justify-center">
              <button
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-white shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
                onClick={() => {
                  setSelectedService({
                    id: 'generic',
                    name: 'Solicitação de Orçamento',
                    description: 'Descreva seu problema e receba um orçamento.',
                  });
                  setQuoteOpen(true);
                }}
              >
                Solicitar Orçamento
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Guidance: concise instructions */}
      <section className="py-10 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">1. Clique em Solicitar</h3>
              <p className="text-sm text-muted-foreground">Abra o formulário simplificado para iniciar sua solicitação.</p>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">2. Informe seus dados</h3>
              <p className="text-sm text-muted-foreground">Preencha nome e WhatsApp. Detalhe o problema brevemente.</p>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">3. Acompanhe pelo WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Você receberá a confirmação e o retorno por este canal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Como <span className="text-gradient">Funciona</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass rounded-2xl p-8 text-center hover-scale">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Entre em Contato</h3>
                <p className="text-muted-foreground">
                  Chame no WhatsApp ou visite nossa loja para descrever o problema
                </p>
              </div>

              <div className="glass rounded-2xl p-8 text-center hover-scale">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Diagnóstico</h3>
                <p className="text-muted-foreground">
                  Realizamos análise completa e fornecemos orçamento transparente
                </p>
              </div>

              <div className="glass rounded-2xl p-8 text-center hover-scale">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Serviço e Garantia</h3>
                <p className="text-muted-foreground">
                  Executamos o reparo com qualidade e entregamos com garantia
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA removed from bottom (foco exclusivo na conversão) */}

      <Footer />
      {/* Quote form modal */}
      {selectedService && (
        <QuoteForm
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          onSuccess={(msg) => {
            setQuoteOpen(false);
            setConfirmMessage(
              msg || "Sua solicitação foi enviada. Em breve entraremos em contato pelo WhatsApp."
            );
            setConfirmOpen(true);
          }}
          service={{
            id: selectedService.id,
            name: selectedService.name,
            description: selectedService.description || null,
          }}
        />
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitação enviada</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Servicos;
