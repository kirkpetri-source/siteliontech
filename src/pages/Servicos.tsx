import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Servicos = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Nossos <span className="text-gradient">Serviços</span>
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            Página em construção. Em breve mais informações sobre nossos serviços.
          </p>
        </div>
      </div>
      <Footer />
      <WhatsAppButton message="Olá! Gostaria de saber mais sobre os serviços disponíveis." />
    </div>
  );
};

export default Servicos;
