import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixPaymentProps {
  qrCode?: string;
  qrCodeBase64?: string;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export const PixPayment = ({ qrCode, qrCodeBase64, onGenerate, isGenerating }: PixPaymentProps) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast({
        title: "Código copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
      });
    }
  };

  if (!qrCode) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gere o QR Code para realizar o pagamento
              </p>
              <Button 
                onClick={onGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? "Gerando..." : "Gerar QR Code PIX"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <h3 className="font-semibold mb-2">Pague com PIX</h3>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code ou copie o código
          </p>
        </div>

        {qrCodeBase64 && (
          <div className="flex justify-center">
            <img 
              src={`data:image/png;base64,${qrCodeBase64}`} 
              alt="QR Code PIX"
              className="w-64 h-64 border rounded-lg"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
            {qrCode}
          </div>
          <Button 
            onClick={copyToClipboard}
            variant="outline"
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar código PIX
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          O pagamento será confirmado automaticamente após a aprovação
        </div>
      </CardContent>
    </Card>
  );
};
