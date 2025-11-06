import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ServiceCard } from "@/components/ServiceCard";
import { Wrench, Cpu, Smartphone, Network, Users, HardDrive, Monitor } from "lucide-react";
import repairImage from "@/assets/service-repair.jpg";
import upgradeImage from "@/assets/service-upgrade.jpg";
import appleImage from "@/assets/service-apple.jpg";

const Servicos = () => {
  const services = [
    {
      title: "Manutenção de PCs e Notebooks",
      description: "Diagnóstico completo, limpeza interna, troca de componentes defeituosos e resolução de problemas de hardware e software.",
      icon: Monitor,
      price: "A partir de R$ 80",
      image: repairImage,
    },
    {
      title: "Upgrades SSD e RAM",
      description: "Aumente drasticamente a velocidade do seu computador com instalação de SSD NVMe e upgrade de memória RAM.",
      icon: Cpu,
      price: "A partir de R$ 150",
      image: upgradeImage,
    },
    {
      title: "Assistência Apple",
      description: "Manutenção especializada em MacBooks, iMacs, iPhones e iPads. Reparos em tela, bateria, placa lógica e mais.",
      icon: Smartphone,
      price: "Consulte",
      image: appleImage,
    },
    {
      title: "Redes e CFTV",
      description: "Instalação e configuração de redes cabeadas e Wi-Fi, câmeras de segurança e sistemas de monitoramento.",
      icon: Network,
      price: "A partir de R$ 200",
    },
    {
      title: "Formatação e Limpeza",
      description: "Formatação completa do sistema, instalação de drivers, programas essenciais e remoção de vírus.",
      icon: HardDrive,
      price: "A partir de R$ 100",
    },
    {
      title: "Suporte Empresarial",
      description: "Suporte técnico continuado para empresas, incluindo manutenção preventiva e atendimento prioritário.",
      icon: Users,
      price: "Planos mensais",
    },
    {
      title: "Montagem de PCs",
      description: "Montagem profissional de computadores gamers e profissionais com as melhores configurações para sua necessidade.",
      icon: Wrench,
      price: "A partir de R$ 150",
    },
    {
      title: "Recuperação de Dados",
      description: "Recuperação profissional de dados perdidos em HDs, SSDs e pen drives danificados.",
      icon: HardDrive,
      price: "Sob consulta",
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <ServiceCard {...service} />
              </div>
            ))}
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
