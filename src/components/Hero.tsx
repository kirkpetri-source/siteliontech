import { ArrowRight, Wrench, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-tech.jpg";

export const Hero = () => {
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
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-foreground mb-4">
              <Zap className="h-4 w-4 text-primary" />
              Assistência Técnica Especializada
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Tecnologia que não te deixa <span className="text-gradient">na mão</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Assistência técnica, upgrades e loja de informática completa em Mineiros-GO. 
            Atendimento rápido, profissional e com garantia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="lg" className="group text-lg">
              Chamar no WhatsApp
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg">
              Ver Serviços
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-6 hover-scale">
              <Wrench className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Manutenção Express</h3>
              <p className="text-sm text-muted-foreground">Reparo rápido e confiável</p>
            </div>
            <div className="glass rounded-2xl p-6 hover-scale">
              <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Upgrades</h3>
              <p className="text-sm text-muted-foreground">SSD, RAM e performance</p>
            </div>
            <div className="glass rounded-2xl p-6 hover-scale">
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
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
      </div>
    </section>
  );
};
