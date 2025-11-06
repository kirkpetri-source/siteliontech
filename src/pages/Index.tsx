import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { ServiceCard } from "@/components/ServiceCard";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Cpu, Smartphone, Network, Monitor, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import repairImage from "@/assets/service-repair.jpg";
import upgradeImage from "@/assets/service-upgrade.jpg";
import appleImage from "@/assets/service-apple.jpg";

const Index = () => {
  const services = [
    {
      title: "Manutenção de PCs e Notebooks",
      description: "Diagnóstico completo, limpeza, troca de componentes e resolução de problemas.",
      icon: Monitor,
      price: "A partir de R$ 80",
      image: repairImage,
    },
    {
      title: "Upgrades SSD e RAM",
      description: "Aumente a velocidade e performance do seu computador com upgrades profissionais.",
      icon: Cpu,
      price: "A partir de R$ 150",
      image: upgradeImage,
    },
    {
      title: "Assistência Apple",
      description: "Manutenção especializada em MacBooks, iPhones e iPads.",
      icon: Smartphone,
      price: "Consulte",
      image: appleImage,
    },
    {
      title: "Redes e CFTV",
      description: "Instalação e configuração de redes, câmeras e sistemas de segurança.",
      icon: Network,
      price: "A partir de R$ 200",
    },
    {
      title: "Suporte Empresarial",
      description: "Suporte técnico continuado para empresas e escritórios.",
      icon: Users,
      price: "Planos mensais",
    },
  ];

  const howWeWork = [
    {
      step: "1",
      title: "Diagnóstico",
      description: "Análise completa do problema sem compromisso",
    },
    {
      step: "2",
      title: "Orçamento",
      description: "Orçamento transparente e sem surpresas",
    },
    {
      step: "3",
      title: "Execução",
      description: "Reparo profissional com peças de qualidade",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      
      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold">
              Nossos <span className="text-gradient">Serviços</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Soluções completas em tecnologia para você e sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Como <span className="text-gradient">Trabalhamos</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Processo simples e transparente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howWeWork.map((item, index) => (
              <div 
                key={index} 
                className="text-center space-y-4 p-8 rounded-2xl glass hover-scale"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 text-center space-y-6 max-w-4xl mx-auto">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Garantia de Qualidade
            </h2>
            <p className="text-xl text-muted-foreground">
              Todos os nossos serviços possuem garantia. Trabalhamos apenas com peças originais 
              e profissionais qualificados para garantir a melhor experiência.
            </p>
            <Button variant="hero" size="lg">
              Solicitar Orçamento
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton message="Olá! Vim pelo site e gostaria de mais informações sobre os serviços." />
    </div>
  );
};

export default Index;
