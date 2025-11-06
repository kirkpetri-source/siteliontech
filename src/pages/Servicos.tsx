import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ServiceCard } from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price: string | null;
  image_url: string | null;
  active: boolean;
}

const Servicos = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices((data as any) || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Wrench;
    return (LucideIcons as any)[iconName] || Wrench;
  };

  const features = [
    "Diagnóstico gratuito",
    "Garantia em todos os serviços",
    "Peças originais",
    "Atendimento rápido",
    "Orçamento sem compromisso",
    "Suporte pós-serviço",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Soluções Completas</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Nossos <span className="text-gradient">Serviços</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Assistência técnica completa e especializada para todas as suas necessidades
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 text-center hover-scale animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-sm font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <ServiceCard 
                    title={service.name}
                    description={service.description || ""}
                    icon={getIconComponent(service.icon)}
                    price={service.price || ""}
                    image={service.image_url || undefined}
                  />
                </div>
              ))}
            </div>
          )}
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

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 text-center space-y-6 max-w-3xl mx-auto">
            <Wrench className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para resolver seu problema?
            </h2>
            <p className="text-xl text-muted-foreground">
              Entre em contato agora e receba um diagnóstico gratuito!
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton message="Olá! Gostaria de saber mais sobre os serviços disponíveis." />
    </div>
  );
};

export default Servicos;
