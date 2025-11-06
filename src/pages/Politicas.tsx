import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Politicas = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Políticas de <span className="text-gradient">Privacidade</span>
          </h1>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-muted-foreground">
              Página em construção. Em breve você encontrará aqui nossas políticas de privacidade, 
              termos de serviço e políticas de devolução.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Politicas;
