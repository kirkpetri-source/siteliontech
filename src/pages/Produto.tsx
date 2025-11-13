import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import useEmblaCarousel from "embla-carousel-react";
import { runUsabilityChecks } from "@/lib/usability-tests";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id?: string | null;
  brand: string;
  image_url: string | null;
  image_urls?: string[] | null;
  stock: number;
  featured: boolean;
}

const currency = (v: number) => `R$ ${v.toFixed(2)}`;

const Produto = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const images: string[] = useMemo(() => {
    if (!product) return [];
    // Sempre prioriza incluir a imagem principal (image_url) como primeira,
    // mesmo quando houver image_urls adicionais.
    const urls = Array.isArray(product.image_urls) ? [...product.image_urls] : [];
    if (product.image_url) {
      // Evita duplicar a principal caso ela já esteja na lista
      if (!urls.includes(product.image_url)) urls.unshift(product.image_url);
    }
    if (urls.length === 0) return ["/placeholder.svg"];
    return urls;
  }, [product]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap() ?? 0);
    emblaApi.on("select", onSelect);
    // Inicializa índice selecionado conforme posição atual
    setSelectedIndex(emblaApi.selectedScrollSnap() ?? 0);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Garante que o índice selecionado permaneça válido quando a lista de imagens mudar
  useEffect(() => {
    if (!emblaApi) return;
    // Re-inicializa o carrossel para refletir mudanças na DOM
    try {
      // Alguns ambientes exigem reInit após mudança de slides
      if (typeof emblaApi.reInit === 'function') emblaApi.reInit();
    } catch {}
    if (selectedIndex >= images.length) {
      setSelectedIndex(0);
      emblaApi.scrollTo(0);
    }
  }, [images.length, emblaApi]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        // Consulta principal incluindo image_urls, com fallback tipado caso o schema não reconheça a coluna
        // Primeiro sem image_urls para evitar o 400 inicial
        const base = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        let productRow: any = base.data as any;
        let queryError: any = base.error as any;

        // Se a coluna image_urls não vier na base, tenta buscar opcionalmente só ela; se falhar, ignora.
        if (!queryError && productRow && typeof (productRow as any).image_urls === 'undefined') {
          const withImages = await supabase
            .from('products')
            .select('id,image_urls')
            .eq('id', id)
            .maybeSingle();
          if (withImages.data && typeof (withImages.data as any).image_urls !== 'undefined') {
            productRow = { ...productRow, image_urls: (withImages.data as any).image_urls };
          }
        }

        if (queryError) throw queryError;
        setProduct(productRow as any);

        if (productRow) {
          const categorySlug = productRow.category;
          const relRes = await supabase
            .from('products')
            .select('id,name,description,price,category,category_id,brand,image_url,stock,featured')
            .eq('category', categorySlug)
            .neq('id', productRow.id)
            .limit(8);
          setRelated((relRes.data as any) || []);
        }
      } catch (err: any) {
        console.error('Erro ao carregar produto:', err);
        setError(err?.message || 'Não foi possível carregar o produto');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    // Basic usability checks in dev
    if (import.meta.env.DEV) {
      runUsabilityChecks('product-page');
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    const image = images[selectedIndex] || null;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: image,
      brand: product.brand,
      category: product.category,
    });
  };

  const onZoomMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = (e.target as HTMLImageElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const installment = useMemo(() => {
    if (!product) return '';
    const times = 12;
    return `em até ${times}x de ${currency(product.price / times)}`;
  }, [product]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 pb-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/loja" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar à loja
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 glass rounded-2xl">
              <h3 className="text-xl font-semibold mb-2">Erro</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : product ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Gallery */}
              <div>
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="relative">
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {images.map((src, i) => (
                          <div key={`${src}-${i}`} className="min-w-0 flex-[0_0_100%]">
                            <div className="relative bg-muted aspect-[4/3]">
                              <img
                                src={src}
                                alt={`${product.name} imagem ${i + 1}`}
                                className={`w-full h-full object-cover select-none ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                loading="lazy"
                                decoding="async"
                                {...({ fetchpriority: i === 0 ? 'high' : 'low' } as any)}
                                onMouseMove={zoom ? onZoomMove : undefined}
                                onMouseEnter={() => setZoom(true)}
                                onMouseLeave={() => setZoom(false)}
                                style={zoom ? {
                                  transform: 'scale(1.5)',
                                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                                  transition: 'transform 120ms ease-out',
                                } : { transition: 'transform 200ms ease' }}
                              />
                              {/* Arrows */}
                              <button
                                type="button"
                                className="absolute left-2 top-1/2 -translate-y-1/2 glass px-2 py-2 rounded-full"
                                onClick={() => emblaApi?.scrollPrev()}
                                aria-label="Imagem anterior"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 glass px-2 py-2 rounded-full"
                                onClick={() => emblaApi?.scrollNext()}
                                aria-label="Próxima imagem"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Thumbs */}
                  {images.length > 1 && (
                    <div className="px-4 py-3 flex gap-3 overflow-x-auto" role="listbox" aria-label="Miniaturas do produto">
                      {images.map((src, idx) => (
                        <button
                          key={`thumb-${src}-${idx}`}
                          type="button"
                          role="option"
                          aria-current={idx === selectedIndex}
                          className={`h-20 w-20 rounded-md overflow-hidden border transition-all ${idx === selectedIndex ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'}`}
                          onClick={() => emblaApi?.scrollTo(idx)}
                          aria-label={`Ver imagem ${idx + 1}`}
                        >
                          <img src={src} alt={`${product?.name || 'Produto'} miniatura ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" {...({ fetchpriority: idx === selectedIndex ? 'high' : 'low' } as any)} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Passe o mouse para ver detalhes com zoom.</p>
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                    {product.featured && <Badge>Em destaque</Badge>}
                  </div>
                  <p className="text-muted-foreground">{product.brand} • {product.category}</p>
                </div>

                <div className="glass rounded-xl p-6 space-y-2">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-primary">{currency(product.price)}</span>
                    <span className="text-sm text-muted-foreground">{installment}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.stock > 0 ? `${product.stock} unidades disponíveis` : 'Indisponível'}
                  </p>
                  <Button
                    variant="hero"
                    className="w-full mt-2"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    aria-label="Adicionar ao carrinho"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Comprar agora
                  </Button>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="prose prose-sm md:prose max-w-none">
                    <h2 className="text-xl font-semibold mb-2">Descrição</h2>
                    <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
                  </div>
                )}

                {/* Specs placeholder */}
                <div>
                  <h2 className="text-xl font-semibold mb-2">Especificações técnicas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="glass rounded-md p-3">Marca: {product.brand}</div>
                    <div className="glass rounded-md p-3">Categoria: {product.category}</div>
                    <div className="glass rounded-md p-3">Disponibilidade: {product.stock > 0 ? 'Em estoque' : 'Indisponível'}</div>
                    <div className="glass rounded-md p-3">Garantia: 12 meses</div>
                  </div>
                </div>

                {/* Reviews mock */}
                <div>
                  <h2 className="text-xl font-semibold mb-2">Avaliações dos clientes</h2>
                  <div className="glass rounded-xl p-4 flex items-center gap-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-muted-foreground" />
                    ))}
                    <span className="text-sm text-muted-foreground">Seja o primeiro a avaliar</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {related.map((p) => (
                <Card key={p.id} className="glass">
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link to={`/produto/${p.id}`} className="hover:text-primary">{p.name}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                      <img src={(p.image_url || (p.image_urls?.[0])) ?? '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <p className="mt-3 text-primary font-semibold">{currency(p.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Produto;