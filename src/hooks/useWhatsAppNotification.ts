import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppNotificationOptions {
  phoneNumber: string;
  message: string;
  messageType: 'contact' | 'order' | 'welcome' | 'custom';
  additionalData?: Record<string, any>;
}

export const useWhatsAppNotification = () => {
  const sendNotification = async (options: WhatsAppNotificationOptions) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: options,
      });

      if (error) {
        console.error('Error sending WhatsApp notification:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error invoking WhatsApp function:', error);
      return { success: false, error };
    }
  };

  const notifyNewOrder = async (order: {
    customerName: string;
    customerPhone: string;
    total: string;
    products: string;
  }) => {
    return sendNotification({
      phoneNumber: '5564999555364', // Business phone
      message: '',
      messageType: 'order',
      additionalData: order,
    });
  };

  const sendWelcomeMessage = async (customerPhone: string) => {
    return sendNotification({
      phoneNumber: customerPhone,
      message: '',
      messageType: 'welcome',
    });
  };

  const notifyContact = async (contact: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }) => {
    // Send to business
    await sendNotification({
      phoneNumber: '5564999555364',
      message: contact.message,
      messageType: 'contact',
      additionalData: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
    });

    // Send welcome to customer
    if (contact.phone) {
      await sendWelcomeMessage(contact.phone);
    }
  };

  return {
    sendNotification,
    notifyNewOrder,
    sendWelcomeMessage,
    notifyContact,
  };
};
