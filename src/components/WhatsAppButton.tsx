import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  message?: string;
}

export const WhatsAppButton = ({ message = "Olá! Gostaria de mais informações." }: WhatsAppButtonProps) => {
  const phoneNumber = "5564999555364"; // +55 64 9 9955-5364
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 animate-float"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};
