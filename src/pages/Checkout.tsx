import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Smartphone, ArrowLeft, CheckCircle } from "lucide-react";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "pix",
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <CheckCircle className="h-20 w-20 text-muted-foreground mx-auto" />
            <h1 className="text-3xl font-bold">Carrinho Vazio</h1>
            <p className="text-muted-foreground">
              Adicione produtos ao carrinho para finalizar a compra.
            </p>
            <Button onClick={() => navigate('/loja')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Loja
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Prepare order details
      const productsText = items
        .map(item => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');

      // Send WhatsApp notification
      const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phoneNumber: '5564999555364',
          message: '',
          messageType: 'order',
          additionalData: {
            customerName: formData.name,
            customerPhone: formData.phone,
            total: total.toFixed(2),
            products: productsText,
          },
        },
      });

      if (whatsappError) {
        console.error('WhatsApp error:', whatsappError);
      }

      // Send confirmation to customer
      if (formData.phone) {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            phoneNumber: formData.phone,
            message: `🦁 *Pedido Confirmado - Lion Tech*\n\n` +
              `Olá ${formData.name}!\n\n` +
              `Seu pedido foi recebido com sucesso!\n\n` +
              `💰 *Total:* R$ ${total.toFixed(2)}\n` +
              `💳 *Pagamento:* ${formData.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}\n\n` +
              `📦 *Produtos:*\n${productsText}\n\n` +
              `Em breve entraremos em contato para confirmar os detalhes.\n\n` +
              `Obrigado por escolher a Lion Tech! 🦁`,
            messageType: 'custom',
          },
        });
      }

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você receberá uma confirmação via WhatsApp em breve.",
      });

      clearCart();
      navigate('/');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro ao processar pedido",
        description: "Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/loja')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Loja
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <div className="glass rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary text-2xl">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">Dados para Entrega</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      placeholder="(00) 0 0000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <div className="flex items-center space-x-2 glass rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4" />
                        PIX (Desconto de 5%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 glass rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.paymentMethod === 'pix' && (
                  <div className="glass rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      ✨ Com PIX você economiza R$ {(total * 0.05).toFixed(2)}!
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      Total com desconto: R$ {(total * 0.95).toFixed(2)}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processando..." : "Finalizar Pedido"}
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao finalizar, você receberá uma confirmação via WhatsApp
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
