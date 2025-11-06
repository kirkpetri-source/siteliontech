import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Upload, Send, Navigation2 } from "lucide-react";

const Contato = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    clientType: "residencial",
    consent: false,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consent) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar a política de privacidade.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simular envio
    setTimeout(() => {
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });
      setIsSubmitting(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        clientType: "residencial",
        consent: false,
      });
      setUploadedFile(null);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15359.234567890123!2d-52.551234567890!3d-17.567890123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDM0JzA0LjQiUyA1MsKwMzMnMDQuNCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Fale Conosco</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Entre em <span className="text-gradient">Contato</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Estamos prontos para ajudar você com suas necessidades tecnológicas
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in">
              <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Telefone</h3>
              <a href="tel:+5564999555364" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                (64) 9 9955-5364
              </a>
            </div>

            <div className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in" style={{ animationDelay: "100ms" }}>
              <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">contato@liontech.com.br</p>
            </div>

            <div className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in" style={{ animationDelay: "200ms" }}>
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Localização</h3>
              <p className="text-sm text-muted-foreground">Mineiros-GO</p>
            </div>

            <div className="glass rounded-2xl p-6 text-center hover-scale animate-fade-in" style={{ animationDelay: "300ms" }}>
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Horário</h3>
              <p className="text-sm text-muted-foreground">Seg-Sex: 08h-18h<br/>Sáb: 08h-12h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form and Map */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="glass rounded-3xl p-8 animate-fade-in">
              <h2 className="text-3xl font-bold mb-6">
                Envie uma <span className="text-gradient">Mensagem</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12"
                    placeholder="Seu nome"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12"
                      placeholder="(00) 0 0000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientType">Tipo de Cliente *</Label>
                  <select
                    id="clientType"
                    value={formData.clientType}
                    onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                    className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="empresarial">Empresarial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-32 resize-none"
                    placeholder="Descreva o problema ou serviço que precisa..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Anexar Imagem (opcional)</Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file"
                      className="flex items-center justify-center gap-2 h-12 px-4 rounded-md border border-input bg-background cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadedFile ? uploadedFile.name : "Escolher arquivo"}
                    </label>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) => setFormData({ ...formData, consent: checked as boolean })}
                  />
                  <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                    Aceito a política de privacidade e autorizo o uso dos meus dados para contato.
                  </Label>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                  <Send className="h-5 w-5 ml-2" />
                </Button>
              </form>
            </div>

            {/* Map */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="glass rounded-3xl overflow-hidden h-[500px]">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização Lion Tech"
                ></iframe>
              </div>

              <Button variant="outline" size="lg" className="w-full" asChild>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Mineiros,GO"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation2 className="h-5 w-5 mr-2" />
                  Traçar Rota no Google Maps
                </a>
              </Button>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Informações da Loja
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">CNPJ</p>
                    <p className="font-mono">44.124.574/0001-47</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Endereço</p>
                    <p>Mineiros-GO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton message="Olá! Gostaria de entrar em contato com a Lion Tech." />
    </div>
  );
};

export default Contato;
