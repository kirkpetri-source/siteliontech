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
            },
          },
          paymentMethods: {
            maxInstallments: 12,
          },
        }}
      />
    </div>
  );
};
