import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Sobre = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Sobre a <span className="text-gradient">Lion Tech</span>
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            Página em construção. Em breve você conhecerá mais sobre nossa história.
          </p>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Sobre;
