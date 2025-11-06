import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    category: string;
    brand: string;
    stock: number;
    featured: boolean;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || null,
      brand: product.brand,
      category: product.category,
    });
  };

  return (
    <Card className="glass hover-scale overflow-hidden">
      {product.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.featured && (
            <Badge className="absolute top-2 right-2" variant="default">
              Destaque
            </Badge>
          )}
          {product.stock <= 0 && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              Esgotado
            </Badge>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{product.name}</CardTitle>
        </div>
        <CardDescription>{product.brand} • {product.category}</CardDescription>
      </CardHeader>
      <CardContent>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="hero" 
          className="w-full"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
        </Button>
      </CardFooter>
    </Card>
  );
};
