import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export const Cart = () => {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="hero" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          Carrinho
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Meu Carrinho
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.brand} • {item.category}
                      </p>
                      <p className="text-lg font-bold text-primary mt-1">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: <span className="font-semibold text-foreground">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}

              <div className="glass rounded-xl p-6 space-y-4 sticky bottom-0">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-2xl text-primary">
                    R$ {total.toFixed(2)}
                  </span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/checkout')}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Finalizar Compra
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
