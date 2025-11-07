import { ArrowRight, Wrench, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-tech.jpg";

export const Hero = () => {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    const phoneNumber = "5564999919124"; // Número do WhatsApp
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da Lion Tech.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleServicesClick = () => {
    navigate("/servicos");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Tecnologia Lion Tech" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div 
            className="inline-block animate-slide-down"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-foreground mb-4">
              <Zap className="h-4 w-4 text-primary animate-glow-pulse" />
              Assistência Técnica Especializada
            </span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            Tecnologia que não te deixa <span className="text-gradient">na mão</span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            Assistência técnica, upgrades e loja de informática completa em Mineiros-GO. 
            Atendimento rápido, profissional e com garantia.
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-scale-in"
            style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
          >
            <Button 
              variant="hero" 
              size="lg" 
              className="group text-lg hover:shadow-elegant transition-all duration-300"
              onClick={handleWhatsAppClick}
            >
              Chamar no WhatsApp
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg hover:bg-primary/10 transition-all duration-300"
              onClick={handleServicesClick}
            >
              Ver Serviços
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto">
            <div 
              className="glass rounded-2xl p-6 hover-scale cursor-pointer group transition-all duration-300 hover:shadow-elegant animate-bounce-in"
              style={{ animationDelay: '0.8s', animationFillMode: 'both' }}
            >
              <Wrench className="h-8 w-8 text-primary mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300" />
              <h3 className="font-semibold mb-1">Manutenção Express</h3>
              <p className="text-sm text-muted-foreground">Reparo rápido e confiável</p>
            </div>
            <div 
              className="glass rounded-2xl p-6 hover-scale cursor-pointer group transition-all duration-300 hover:shadow-elegant animate-bounce-in"
              style={{ animationDelay: '1s', animationFillMode: 'both' }}
            >
              <Zap className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold mb-1">Upgrades</h3>
              <p className="text-sm text-muted-foreground">SSD, RAM e performance</p>
            </div>
            <div 
              className="glass rounded-2xl p-6 hover-scale cursor-pointer group transition-all duration-300 hover:shadow-elegant animate-bounce-in"
              style={{ animationDelay: '1.2s', animationFillMode: 'both' }}
            >
              <Shield className="h-8 w-8 text-primary mx-auto mb-3 group-hover:-rotate-6 transition-transform duration-300" />
              <h3 className="font-semibold mb-1">Garantia</h3>
              <p className="text-sm text-muted-foreground">Serviço com qualidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
    </section>
  );
};
