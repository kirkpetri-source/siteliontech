import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppNotificationOptions {
  phoneNumber: string;
  message: string;
  messageType: 'contact' | 'order' | 'welcome' | 'custom' | 'quote';
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

  const requestQuote = async (payload: {
    serviceId?: string;
    serviceName: string;
    categoryName?: string;
    serviceDescription?: string;
    benefits?: string[];
    prerequisites?: string[];
    customerName: string;
    customerPhone: string;
    customerContact?: string;
    details?: string;
  }) => {
    // Gerar ID no cliente para evitar SELECT sob RLS e ter referência imediata
    const quoteId = crypto.randomUUID();
    const insertResult = await supabase
      .from('quotes' as any)
      .insert({
        id: quoteId,
        service_id: payload.serviceId || null,
        service_name: payload.serviceName,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_contact: payload.customerContact || null,
        details: payload.details || null,
        status: 'requested',
      });

    if (insertResult.error) {
      console.error('Error creating quote:', insertResult.error);
    }

    // Send to business queue (orçamentos)
    const businessPhone = import.meta.env.VITE_WHATSAPP_ORCAMENTOS || '5564999555364';

    await sendNotification({
      phoneNumber: businessPhone,
      message: payload.details || '',
      messageType: 'quote',
      additionalData: {
        quoteId,
        serviceName: payload.serviceName,
        categoryName: payload.categoryName,
        serviceDescription: payload.serviceDescription,
        benefits: payload.benefits || [],
        prerequisites: payload.prerequisites || [],
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerContact: payload.customerContact,
        queueLabel: 'Orçamentos',
      },
    });

    // Confirmation to customer (formal, includes customer name, no emojis)
    const confirmation = `Prezado(a) ${payload.customerName},\n\nRecebemos sua solicitação de orçamento. Nossa equipe de Orçamentos está analisando e retornará por este canal em breve.\n\nPara agilizar o atendimento, responda com quaisquer informações adicionais. Agradecemos o contato.`;

    await sendNotification({
      phoneNumber: payload.customerPhone,
      message: confirmation,
      messageType: 'custom',
    });

    return { success: true, quoteId };
  };

  return {
    sendNotification,
    notifyNewOrder,
    sendWelcomeMessage,
    notifyContact,
    requestQuote,
  };
};
