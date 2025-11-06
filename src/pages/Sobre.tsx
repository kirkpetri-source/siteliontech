import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Shield, Target, Eye, Heart, Users, Award } from "lucide-react";

const Sobre = () => {
  const values = [
    {
      icon: Shield,
      title: "Confiança",
      description: "Transparência e honestidade em todos os nossos serviços",
    },
    {
      icon: Target,
      title: "Excelência",
      description: "Buscamos sempre a melhor solução para nossos clientes",
    },
    {
      icon: Heart,
      title: "Compromisso",
      description: "Dedicação total à satisfação do cliente",
    },
    {
      icon: Award,
      title: "Qualidade",
      description: "Apenas peças originais e serviços profissionais",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quem Somos</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Sobre a <span className="text-gradient">Lion Tech</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Sua parceira em soluções tecnológicas em Mineiros-GO
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl p-8 md:p-12 space-y-6 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Nossa <span className="text-gradient">História</span>
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  A Lion Tech nasceu da paixão por tecnologia e do desejo de oferecer soluções 
                  de qualidade para a comunidade de Mineiros-GO. Com anos de experiência no mercado, 
                  nos consolidamos como referência em assistência técnica e vendas de equipamentos.
                </p>
                <p>
                  Nossa equipe é formada por profissionais qualificados e apaixonados pelo que fazem. 
                  Trabalhamos apenas com peças originais e seguimos os mais altos padrões de qualidade 
                  em todos os serviços prestados.
                </p>
                <p>
                  Atendemos tanto clientes residenciais quanto empresariais, oferecendo soluções 
                  personalizadas para cada necessidade. Seja um reparo simples ou um projeto completo 
                  de infraestrutura de TI, estamos prontos para ajudar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="glass rounded-2xl p-8 text-center hover-scale animate-fade-in">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Missão</h3>
              <p className="text-muted-foreground">
                Oferecer soluções tecnológicas de excelência, com atendimento humanizado 
                e preços justos, facilitando o acesso à tecnologia de qualidade.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center hover-scale animate-fade-in" style={{ animationDelay: "100ms" }}>
              <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Visão</h3>
              <p className="text-muted-foreground">
                Ser a referência em serviços de tecnologia na região, reconhecida pela 
                qualidade, confiança e inovação em nossas soluções.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center hover-scale animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Valores</h3>
              <p className="text-muted-foreground">
                Transparência, compromisso com a excelência, respeito ao cliente, 
                e busca constante por inovação e aperfeiçoamento.
              </p>
            </div>
          </div>

          {/* Core Values Grid */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Nossos <span className="text-gradient">Valores</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <value.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que escolher a <span className="text-gradient">Lion Tech</span>?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 hover-scale">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Garantia de Qualidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Todos os serviços com garantia e uso de peças originais
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 hover-scale">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Equipe Qualificada</h3>
                    <p className="text-sm text-muted-foreground">
                      Profissionais certificados e com vasta experiência
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 hover-scale">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Atendimento Personalizado</h3>
                    <p className="text-sm text-muted-foreground">
                      Soluções sob medida para cada cliente e situação
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 hover-scale">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Preços Justos</h3>
                    <p className="text-sm text-muted-foreground">
                      Orçamentos transparentes e sem taxas ocultas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 text-center space-y-6 max-w-3xl mx-auto">
            <Users className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Venha nos conhecer!
            </h2>
            <p className="text-xl text-muted-foreground">
              Visite nossa loja em Mineiros-GO ou entre em contato pelo WhatsApp. 
              Estamos prontos para atender você!
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sobre;
