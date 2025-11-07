import { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment as MPCardPayment } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';

interface CardPaymentProps {
  amount: number;
  onSubmit: (paymentData: any) => Promise<void>;
  customerEmail: string;
  customerName: string;
}

export const CardPayment = ({ amount, onSubmit, customerEmail, customerName }: CardPaymentProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
      setIsInitialized(true);
    }
  }, []);

  const onSubmitPayment = async (formData: any) => {
    console.log('Card payment form data:', formData);
    await onSubmit(formData);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-2">Opções de Parcelamento</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Parcele em até 12x no cartão de crédito. O cálculo dos juros é feito automaticamente conforme as taxas do Mercado Pago.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-foreground">1x sem juros</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <span className="text-muted-foreground">2-12x com juros</span>
          </div>
        </div>
      </div>

      <MPCardPayment
        initialization={{
          amount: amount,
          payer: {
            email: customerEmail,
          },
        }}
        onSubmit={onSubmitPayment}
        customization={{
          visual: {
            style: {
              theme: 'default',
              customVariables: {
                baseColor: '#8B5CF6',
                textPrimaryColor: '#1a1a1a',
                textSecondaryColor: '#666666',
                inputBackgroundColor: '#ffffff',
                borderRadiusSmall: '8px',
                borderRadiusMedium: '12px',
                borderRadiusLarge: '16px',
              }
            },
          },
          paymentMethods: {
            maxInstallments: 12,
            minInstallments: 1,
          },
        }}
      />

      <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg border border-border">
        <p className="font-medium mb-1">ℹ️ Informações sobre parcelamento:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Parcela mínima: R$ 5,00</li>
          <li>As taxas variam conforme o emissor do cartão</li>
          <li>O valor final será exibido antes da confirmação</li>
        </ul>
      </div>
    </div>
  );
};
