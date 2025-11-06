import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BeforeAfter } from "@/components/BeforeAfter";
import { TestimonialCard } from "@/components/TestimonialCard";
import { testimonials } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Award, Users, CheckCircle2, Star } from "lucide-react";

interface Case {
  id: string;
  title: string;
  description: string | null;
  before_image: string;
  after_image: string;
  active: boolean;
}

const Cases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases' as any)
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCases((data as any) || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };
  const stats = [
    { label: "Clientes Atendidos", value: "500+", icon: Users },
    { label: "Projetos Concluídos", value: "1000+", icon: CheckCircle2 },
    { label: "Anos de Experiência", value: "5+", icon: Award },
    { label: "Avaliação Média", value: "5.0", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Nosso Trabalho</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="text-gradient">Cases</span> de Sucesso
            </h1>
            <p className="text-xl text-muted-foreground">
              Transformando problemas em soluções. Veja alguns dos nossos melhores trabalhos.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-gradient mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Antes e <span className="text-gradient">Depois</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Arraste o controle para ver a transformação dos equipamentos
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cases.map((caseItem, index) => (
                <div
                  key={caseItem.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <BeforeAfter 
                    title={caseItem.title}
                    description={caseItem.description || ""}
                    beforeImage={caseItem.before_image}
                    afterImage={caseItem.after_image}
                    category="Reparos"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              O que dizem nossos <span className="text-gradient">Clientes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Depoimentos reais de quem confia no nosso trabalho
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 text-center space-y-6 max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Seu equipamento merece o melhor!
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Junte-se aos nossos clientes satisfeitos. Entre em contato e faça um orçamento sem compromisso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton message="Olá! Vi os cases de sucesso e gostaria de fazer um orçamento." />
    </div>
  );
};

export default Cases;
