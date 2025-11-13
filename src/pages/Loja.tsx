import { useState, useMemo, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { ShopPromoBanner } from "@/components/ShopPromoBanner";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  brand: string;
  image_url: string | null;
  image_urls?: string[] | null;
  stock: number;
  featured: boolean;
}

const Loja = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("Todos");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const brands = ["Todos", "Dell", "Lenovo", "HP", "Asus", "Apple"];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('id, name, slug, icon, color')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories((data as any) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Consulta principal sem image_urls para evitar 400 visível caso o schema não tenha propagado
      const base = await supabase
        .from('products')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (base.error) throw base.error;
      setProducts((base.data as any) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = ["Todos", ...categories.map(c => c.slug)];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Match by category slug from the categories table
      const productCategorySlug = (product as any).categories?.slug || product.category;
      const matchesCategory = selectedCategory === "Todos" || productCategorySlug === selectedCategory;
      
      const matchesBrand = selectedBrand === "Todos" || product.brand === selectedBrand;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Catálogo Completo</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Nossa <span className="text-gradient">Loja</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Componentes, periféricos e acessórios de alta qualidade para seu computador
            </p>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <ShopPromoBanner />
        </div>
      </section>

      {/* Filters and Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            categories={categoryOptions}
            brands={brands}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Results Count */}
          <div className="mt-8 mb-4">
            <p className="text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass rounded-2xl">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou fazer uma nova busca
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Não encontrou o que procura?
            </h2>
            <p className="text-xl text-muted-foreground">
              Entre em contato conosco pelo WhatsApp e consulte disponibilidade de outros produtos!
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Loja;
