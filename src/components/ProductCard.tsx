import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Product } from "@/lib/mockData";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Card className="group overflow-hidden border-border/50 hover:shadow-elegant transition-all duration-500 hover:-translate-y-2">
      <div className="relative overflow-hidden bg-muted/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge === "new" && (
            <Badge className="bg-primary text-white">Novo</Badge>
          )}
          {product.badge === "promo" && (
            <Badge className="bg-destructive text-white">Promoção</Badge>
          )}
          {!product.inStock && (
            <Badge variant="secondary">Esgotado</Badge>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
          <Button variant="secondary" size="sm" className="hover-scale">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="hero" size="sm" disabled={!product.inStock} className="hover-scale">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        {product.specs && (
          <div className="flex flex-wrap gap-1">
            {product.specs.slice(0, 3).map((spec, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-2xl font-bold text-gradient font-mono">
              {formatPrice(product.price)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!product.inStock}
            className="hover:bg-primary/10"
          >
            {product.inStock ? "Ver mais" : "Indisponível"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
