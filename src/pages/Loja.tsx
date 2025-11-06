import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Loja = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Nossa <span className="text-gradient">Loja</span>
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            Página em construção. Em breve você poderá navegar por nossos produtos.
          </p>
        </div>
      </div>
      <Footer />
      <WhatsAppButton message="Olá! Gostaria de saber sobre produtos disponíveis na loja." />
    </div>
  );
};

export default Loja;
