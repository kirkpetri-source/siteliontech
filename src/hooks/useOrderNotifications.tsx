import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useOrderNotifications() {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const playNotificationSound = useCallback(() => {
    // Create a simple notification beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const markAsRead = useCallback(() => {
    setNewOrdersCount(0);
  }, []);

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel("new-orders-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Only show notification if it's not the first load
          if (lastOrderId !== null) {
            setNewOrdersCount((prev) => prev + 1);
            playNotificationSound();
            
            toast({
              title: "🦁 Novo Pedido Recebido!",
              description: `Pedido #${newOrder.id.substring(0, 8).toUpperCase()} de ${newOrder.customer_name}`,
              duration: 5000,
            });
          }
          
          setLastOrderId(newOrder.id);
        }
      )
      .subscribe();

    // Get the latest order on mount to set initial state
    const getLatestOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Avoid noisy 406 when there are no orders yet
        if ((error as any).status !== 406) {
          console.warn("getLatestOrder error:", error.message);
        }
        return;
      }

      if (data) {
        setLastOrderId(data.id);
      }
    };

    getLatestOrder();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastOrderId, playNotificationSound, toast]);

  return {
    newOrdersCount,
    markAsRead,
  };
}
