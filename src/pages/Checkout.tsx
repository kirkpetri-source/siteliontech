import { useEffect, useState } from "react";
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
import { CreditCard, Smartphone, ArrowLeft, CheckCircle, Tag, Loader2 } from "lucide-react";
import { z } from "zod";
import { CardPayment } from "@/components/payment/CardPayment";
import { PixPayment } from "@/components/payment/PixPayment";

const checkoutSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  phone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido"),
  zipCode: z.string().trim().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().trim().min(3, "Rua é obrigatória").max(200, "Rua muito longa"),
  number: z.string().trim().min(1, "Número é obrigatório").max(10, "Número muito longo"),
  neighborhood: z.string().trim().min(2, "Bairro é obrigatório").max(100, "Bairro muito longo"),
  city: z.string().trim().min(2, "Cidade é obrigatória").max(100, "Cidade muito longa"),
  state: z.string().trim().length(2, "UF deve ter 2 caracteres"),
  paymentMethod: z.enum(["pix", "card"]),
});

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixExpiresAt, setPixExpiresAt] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    address: "",
    paymentMethod: "pix",
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate discount based on payment method and coupon
  const paymentDiscount = formData.paymentMethod === 'pix' ? total * 0.05 : 0;
  const couponDiscount = appliedCoupon?.discount_amount || 0;
  const finalTotal = total - paymentDiscount - couponDiscount;

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, zipCode: cep }));
    setCepError("");

    if (cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
          setCepError("CEP não encontrado");
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado.",
            variant: "destructive",
          });
          return;
        }

        setFormData(prev => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
        }));

        toast({
          title: "Endereço encontrado!",
          description: "Preencha o número e complemento.",
        });
      } catch (error) {
        setCepError("Erro ao buscar CEP");
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const validateForm = () => {
    try {
      checkoutSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Digite um cupom",
        description: "Por favor, insira um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        coupon_code: couponCode.toUpperCase().trim(),
        order_total: total,
      });

      if (error) throw error;

      const couponResult = data as any;

      if (couponResult.valid) {
        setAppliedCoupon(couponResult);
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de R$ ${couponResult.discount_amount.toFixed(2)} aplicado.`,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: couponResult.error || "Este cupom não pode ser aplicado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o cupom.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do pedido.",
    });
  };

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

  const handleGeneratePix = async () => {
    if (!currentOrderId) return;
    
    setIsGeneratingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
        body: {
          orderId: currentOrderId,
          paymentMethod: 'pix',
          paymentData: {
            transaction_amount: finalTotal,
            description: `Pedido Lion Tech #${currentOrderId.substring(0, 8).toUpperCase()}`,
            payer: {
              email: formData.email,
              first_name: formData.name.split(' ')[0],
            },
          },
        },
      });

      if (error) throw error;

      // Evita UPDATE direto na tabela orders (RLS restringe updates a admins).
      // Mantém dados do PIX em estado local e deixa o webhook atualizar a ordem.

      setPixData(data);
      setPaymentStatus(data.status);
      const expires = (data && (data.date_of_expiration || data.expiration_date || data.expires_at)) ?? null;
      if (expires) {
        setPixExpiresAt(expires);
      } else {
        // fallback de 30 minutos
        setPixExpiresAt(new Date(Date.now() + 30 * 60 * 1000).toISOString());
      }
      
      toast({
        title: "QR Code gerado!",
        description: "Escaneie o QR Code para realizar o pagamento.",
      });
    } catch (error) {
      console.error('Error generating PIX:', error);
      toast({
        title: "Erro ao gerar PIX",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCardPayment = async (paymentData: any) => {
    if (!currentOrderId) return;

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
        body: {
          orderId: currentOrderId,
          paymentMethod: paymentData.payment_method_id,
          paymentData: {
            transaction_amount: finalTotal,
            description: `Pedido Lion Tech #${currentOrderId.substring(0, 8).toUpperCase()}`,
            token: paymentData.token,
            installments: paymentData.installments,
            issuer_id: paymentData.issuer_id,
            payer: {
              email: formData.email,
              first_name: formData.name.split(' ')[0],
              identification: {
                type: paymentData.payer.identification.type,
                number: paymentData.payer.identification.number,
              },
            },
          },
        },
      });

      if (error) throw error;

      // Evita UPDATE direto na tabela orders (RLS restringe updates a admins).
      // Usa estado local para refletir status e deixa webhook atualizar a ordem.
      setPaymentStatus(data.status);

      if (data.status === 'approved') {
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pedido está sendo processado.",
        });
        clearCart();
        navigate('/');
      } else {
        toast({
          title: "Pagamento pendente",
          description: "Aguardando confirmação do pagamento.",
        });
      }
    } catch (error) {
      console.error('Error processing card payment:', error);
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente ou escolha outra forma de pagamento.",
        variant: "destructive",
      });
    }
  };

  // Subscrição em tempo real para status do pedido (PIX)
  useEffect(() => {
    if (!currentOrderId) return;
    const channel = supabase
      .channel(`order-status-${currentOrderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${currentOrderId}`,
      }, (payload: any) => {
        const newPaymentStatus = payload?.new?.payment_status || null;
        const newStatus = payload?.new?.status || null;
        if (newPaymentStatus) setPaymentStatus(newPaymentStatus);
        if (newPaymentStatus === 'approved' || newStatus === 'processing') {
          toast({
            title: 'PIX aprovado!',
            description: 'Seu pedido está sendo processado.',
          });
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [currentOrderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Build full address
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.zipCode}`;

      // Gera ID de pedido no cliente para evitar SELECT (RLS restringe SELECT a admins)
      const newOrderId = crypto.randomUUID();

      // Create order in database (sem .select())
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: newOrderId,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_address: fullAddress,
          payment_method: formData.paymentMethod,
          subtotal: total,
          discount: paymentDiscount + couponDiscount,
          coupon_code: appliedCoupon?.code || null,
          total: finalTotal,
          status: 'pending',
        });

      if (orderError) throw orderError;

      setCurrentOrderId(newOrderId);

      // Create order items
      const orderItems = items.map(item => ({
        order_id: newOrderId,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ current_uses: appliedCoupon.current_uses + 1 })
          .eq('code', appliedCoupon.code);
      }

      // Prepare order details
      const productsText = items
        .map(item => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');

      let orderSummary = `💰 *Subtotal:* R$ ${total.toFixed(2)}`;
      
      if (formData.paymentMethod === 'pix') {
        orderSummary += `\n💳 *Desconto PIX (5%):* -R$ ${paymentDiscount.toFixed(2)}`;
      }
      
      if (appliedCoupon) {
        orderSummary += `\n🎟️ *Cupom ${appliedCoupon.code}:* -R$ ${couponDiscount.toFixed(2)}`;
      }
      
      orderSummary += `\n✅ *Total Final:* R$ ${finalTotal.toFixed(2)}`;
      orderSummary += `\n📝 *Pedido:* #${newOrderId.substring(0, 8).toUpperCase()}`;

      // Send WhatsApp notification
      const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phoneNumber: '5564999555364',
          message: '',
          messageType: 'order',
          additionalData: {
            customerName: formData.name,
            customerPhone: formData.phone,
            total: finalTotal.toFixed(2),
            products: productsText + '\n\n' + orderSummary,
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
              `${orderSummary}\n` +
              `💳 *Pagamento:* ${formData.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}\n\n` +
              `📦 *Produtos:*\n${productsText}\n\n` +
              `Em breve entraremos em contato para confirmar os detalhes.\n\n` +
              `Obrigado por escolher a Lion Tech! 🦁`,
            messageType: 'custom',
          },
        });
      }

      // Show payment form instead of redirecting
      setShowPaymentForm(true);
      
      toast({
        title: "Pedido criado!",
        description: "Agora finalize o pagamento para confirmar.",
      });
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

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">R$ {total.toFixed(2)}</span>
                  </div>

                  {formData.paymentMethod === 'pix' && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX (5%):</span>
                      <span className="font-semibold">-R$ {paymentDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-primary">
                      <span>Cupom {appliedCoupon.code}:</span>
                      <span className="font-semibold">-R$ {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total Final:</span>
                    <span className="text-primary text-2xl">
                      R$ {finalTotal.toFixed(2)}
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
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                {/* CEP and Address Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                        className={cepError ? "border-destructive" : ""}
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {cepError && (
                      <p className="text-xs text-destructive">{cepError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Digite apenas números
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="Nome da rua"
                        required
                        disabled={isLoadingCep}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder="Apto, Bloco, etc"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Nome do bairro"
                        required
                        disabled={isLoadingCep}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Nome da cidade"
                        required
                        disabled={isLoadingCep}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">UF *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        placeholder="GO"
                        maxLength={2}
                        required
                        disabled={isLoadingCep}
                      />
                    </div>
                  </div>
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
                      ✨ Com PIX você economiza R$ {paymentDiscount.toFixed(2)}!
                    </p>
                  </div>
                )}

                {/* Coupon Section */}
                <div className="space-y-3">
                  <Label>Cupom de Desconto</Label>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="DIGITE SEU CUPOM"
                        className="flex-1"
                        maxLength={20}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={validateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Tag className="mr-2 h-4 w-4" />
                            Aplicar
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="glass rounded-lg p-4 border border-primary/20 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {appliedCoupon.code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Desconto de R$ {couponDiscount.toFixed(2)} aplicado!
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {/* Final Order Summary */}
                <div className="glass rounded-xl p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Resumo do Pedido
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Subtotal dos produtos</span>
                      <span className="font-semibold">R$ {total.toFixed(2)}</span>
                    </div>

                    {/* Payment Method */}
                    <div className="flex justify-between items-center py-2 border-t border-border/50">
                      <span className="text-muted-foreground">Forma de pagamento</span>
                      <span className="font-semibold flex items-center gap-2">
                        {formData.paymentMethod === 'pix' ? (
                          <>
                            <Smartphone className="h-4 w-4 text-green-600" />
                            PIX
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 text-primary" />
                            Cartão de Crédito
                          </>
                        )}
                      </span>
                    </div>

                    {/* Discounts */}
                    {(paymentDiscount > 0 || appliedCoupon) && (
                      <div className="space-y-2 py-2 border-t border-border/50">
                        {paymentDiscount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="text-sm flex items-center gap-1">
                              💰 Desconto PIX (5%)
                            </span>
                            <span className="font-semibold">-R$ {paymentDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-primary">
                            <span className="text-sm flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Cupom {appliedCoupon.code}
                            </span>
                            <span className="font-semibold">-R$ {couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-primary/30">
                      <span className="text-lg font-bold">Total a pagar</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {finalTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Savings Badge */}
                    {(paymentDiscount > 0 || appliedCoupon) && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <p className="text-sm font-semibold text-green-600">
                          🎉 Você está economizando R$ {(paymentDiscount + couponDiscount).toFixed(2)}!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!showPaymentForm ? (
                  <>
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processando..." : "Continuar para Pagamento"}
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Ao continuar, você será direcionado para o pagamento
                    </p>
                  </>
                ) : (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-xl font-bold">Finalizar Pagamento</h3>
                    
                    {formData.paymentMethod === 'pix' ? (
                      <PixPayment
                        qrCode={pixData?.qr_code}
                        qrCodeBase64={pixData?.qr_code_base64}
                        expiresAt={pixExpiresAt}
                        status={paymentStatus}
                        onGenerate={handleGeneratePix}
                        isGenerating={isGeneratingPix}
                      />
                    ) : (
                      <CardPayment
                        amount={finalTotal}
                        onSubmit={handleCardPayment}
                        customerEmail={formData.email}
                        customerName={formData.name}
                      />
                    )}
                  </div>
                )}
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
