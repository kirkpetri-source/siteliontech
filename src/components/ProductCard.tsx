import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    image_urls?: string[] | null;
    category: string;
    brand: string;
    stock: number;
    featured: boolean;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  // Monta imagens garantindo que a principal (image_url) seja incluída primeiro
  const images: string[] = (() => {
    const urls = Array.isArray(product.image_urls) ? [...product.image_urls] : [];
    if (product.image_url) {
      if (!urls.includes(product.image_url)) urls.unshift(product.image_url);
    }
    return urls.length > 0 ? urls : ["/placeholder.svg"];
  })();
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = images[currentIndex] || "/placeholder.svg";
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setFading(true);
    const t = setTimeout(() => setFading(false), 180);
    return () => clearTimeout(t);
  }, [currentIndex]);

  // Ajusta índice quando a quantidade de imagens mudar
  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images.length]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: current || null,
      brand: product.brand,
      category: product.category,
    });
  };

  return (
    <Card className="glass hover-scale overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-muted">
        <Link to={`/produto/${product.id}`} aria-label={`Ver detalhes de ${product.name}`} className="block h-full">
          <img 
            src={current} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-[1.03] transition-opacity ${fading ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
          />
        </Link>
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
      {images.length > 1 && (
        <div className="px-4 pt-2 flex gap-3 overflow-x-auto" role="listbox" aria-label="Imagens do produto">
          {images.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              role="option"
              aria-label={`Ver imagem ${idx + 1}`}
              aria-current={idx === currentIndex}
              className={`h-20 w-20 rounded-md overflow-hidden border transition-all ${idx === currentIndex ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'}`}
              onClick={() => setCurrentIndex(idx)}
              title="Ver imagem"
            >
              <img src={src} alt={`${product.name} miniatura ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link to={`/produto/${product.id}`} className="hover:text-primary transition-colors" aria-label={`Abrir página de ${product.name}`}>
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </Link>
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
