import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  categories: Category | null;
  brand: string;
  image_url: string | null;
  image_urls?: string[] | null;
  stock: number;
  featured: boolean;
}

export const ProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_IMAGES = 10;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    brand: "Dell",
    image_url: "",
    stock: "0",
    featured: false,
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('id, name, slug')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories((data as any) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Consulta sem image_urls para evitar 400 caso o schema ainda não tenha refletido a coluna
      const base = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (base.error) throw base.error;
      setProducts((base.data as any) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async (files: FileList | File[]): Promise<string[]> => {
    const list = Array.from(files);
    const urls: string[] = [];
    for (const f of list) {
      const url = await handleImageUpload(f);
      if (url) urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      // Mescla imagens: principal primeiro, sem duplicatas e respeitando o limite
      const mergedImages = (() => {
        const list = [...uploadedImages];
        if (formData.image_url) {
          const idx = list.indexOf(formData.image_url);
          if (idx > -1) {
            list.splice(idx, 1);
          }
          list.unshift(formData.image_url);
        }
        return list.filter((u, i, arr) => arr.indexOf(u) === i).slice(0, MAX_IMAGES);
      })();
      const productBase = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: selectedCategory?.name || "",
        category_id: formData.category_id || null,
        brand: formData.brand,
        image_url: formData.image_url || null,
        stock: parseInt(formData.stock),
        featured: formData.featured,
      };
      const productFull = {
        ...productBase,
        ...(mergedImages.length > 0 ? { image_urls: mergedImages } : {}),
      } as any;

      if (editingProduct) {
        try {
          const { error } = await supabase
            .from('products')
            .update(productFull)
            .eq('id', editingProduct.id);
          if (error) throw error;
        } catch (error: any) {
          const msg = String(error?.message || '').toLowerCase();
          const status = (error as any)?.status;
          if (msg.includes('image_urls') || msg.includes('column') || msg.includes('schema') || status === 400) {
            // Fallback sem image_urls quando coluna não existir
            const { error: fbError } = await supabase
              .from('products')
              .update(productBase as any)
              .eq('id', editingProduct.id);
            if (fbError) throw fbError;
            toast({ title: 'Atualizado com compatibilidade', description: 'Outras imagens não foram persistidas (coluna image_urls ausente).', variant: 'default' });
          } else {
            throw error;
          }
        }

        toast({
          title: "Produto atualizado!",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        try {
          const { error } = await supabase
            .from('products')
            .insert([productFull]);
          if (error) throw error;
        } catch (error: any) {
          const msg = String(error?.message || '').toLowerCase();
          const status = (error as any)?.status;
          if (msg.includes('image_urls') || msg.includes('column') || msg.includes('schema') || status === 400) {
            const { error: fbError } = await supabase
              .from('products')
              .insert([productBase as any]);
            if (fbError) throw fbError;
            toast({ title: 'Criado com compatibilidade', description: 'Outras imagens não foram persistidas (coluna image_urls ausente).', variant: 'default' });
          } else {
            throw error;
          }
        }

        toast({
          title: "Produto criado!",
          description: "O produto foi adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error?.message || error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Produto excluído!",
        description: "O produto foi removido com sucesso.",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category_id: product.category_id || "",
      brand: product.brand,
      image_url: product.image_url || "",
      stock: product.stock.toString(),
      featured: product.featured,
    });
    const urlsRaw = (product.image_urls && Array.isArray(product.image_urls))
      ? product.image_urls
      : (product.image_url ? [product.image_url] : []);
    const urls = (() => {
      const list = [...urlsRaw];
      if (product.image_url) {
        const idx = list.indexOf(product.image_url);
        if (idx > -1) {
          list.splice(idx, 1);
        }
        list.unshift(product.image_url);
      }
      return list.filter((u, i, arr) => arr.indexOf(u) === i).slice(0, MAX_IMAGES);
    })();
    setUploadedImages(urls);
    if (!product.image_url && urls.length > 0) {
      setFormData(prev => ({ ...prev, image_url: urls[0] }));
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setUploadedImages([]);
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      brand: "Dell",
      image_url: "",
      stock: "0",
      featured: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="product-dialog-desc">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <p id="product-dialog-desc" className="sr-only">Formulário para criar ou editar produto, com gerenciamento de imagens adicionais.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <select
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="Dell">Dell</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="HP">HP</option>
                    <option value="Asus">Asus</option>
                    <option value="Apple">Apple</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem Principal</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_file">Ou fazer upload de imagens (múltiplas)</Label>
                {/* Input real fica oculto; usamos botão estilizado para melhor UX */}
                <Input
                  id="image_file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement;
                    const filesList = inputEl.files;
                    if (!filesList || filesList.length === 0) return;
                    const current = uploadedImages;
                    if (current.length >= MAX_IMAGES) {
                      toast({ title: "Limite atingido", description: `Máximo de ${MAX_IMAGES} imagens.`, variant: "destructive" });
                      inputEl.value = "";
                      return;
                    }
                    const spaceLeft = Math.max(0, MAX_IMAGES - current.length);
                    const filesLimited = Array.from(filesList).slice(0, spaceLeft);
                    if (filesList.length > filesLimited.length) {
                      toast({ title: "Limitando upload", description: `Somente ${spaceLeft} imagens adicionais serão enviadas.` });
                    }
                    const urls = await handleImagesUpload(filesLimited);
                    if (urls.length > 0) {
                      const merged = [...current, ...urls].filter((u, i, arr) => arr.indexOf(u) === i).slice(0, MAX_IMAGES);
                      setUploadedImages(merged);
                      if (!formData.image_url) {
                        setFormData({ ...formData, image_url: merged[0] });
                      }
                      toast({ title: "Imagens adicionadas", description: `${urls.length} novas imagens foram adicionadas.` });
                    }
                    inputEl.value = "";
                  }}
                  disabled={uploading}
                />
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="w-full sm:w-auto gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || uploadedImages.length >= MAX_IMAGES}
                    aria-label="Escolher arquivos para upload"
                    title="Escolher arquivos"
                  >
                    <Upload className="h-5 w-5" />
                    Escolher arquivos
                  </Button>
                  <span className="text-sm text-muted-foreground">{uploadedImages.length}/{MAX_IMAGES} imagens</span>
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Fazendo upload...</p>}
                {uploadedImages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Selecione a imagem principal:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((url, idx) => (
                        <div
                          key={url}
                          className={`relative h-24 rounded-md overflow-hidden border ${formData.image_url === url ? 'border-primary' : 'border-muted'}`}
                          title={formData.image_url === url ? 'Imagem principal' : 'Clique para definir como principal'}
                        >
                          <button
                            type="button"
                            className="absolute inset-0"
                            onClick={() => {
                              setFormData({ ...formData, image_url: url });
                              setUploadedImages([url, ...uploadedImages.filter(u => u !== url)]);
                            }}
                            aria-label="Definir como principal"
                          />
                          <img src={url} alt="Pré-visualização" className="w-full h-full object-cover pointer-events-none" />
                          {/* Indicadores e ações */}
                          {formData.image_url === url && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Principal</span>
                          )}
                          <span className="absolute bottom-1 left-1 bg-muted/80 text-xs px-1.5 py-0.5 rounded">{idx + 1}</span>
                          <div className="absolute top-1 right-1 flex items-center gap-1">
                            <button
                              type="button"
                              className="glass rounded p-1 hover:brightness-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx === 0) return;
                                const next = [...uploadedImages];
                                const [item] = next.splice(idx, 1);
                                next.splice(idx - 1, 0, item);
                                setUploadedImages(next);
                              }}
                              aria-label="Mover imagem para esquerda"
                              title="Mover para esquerda"
                              disabled={idx === 0}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="glass rounded p-1 hover:brightness-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = [...uploadedImages];
                                if (idx >= next.length - 1) return;
                                const [item] = next.splice(idx, 1);
                                next.splice(idx + 1, 0, item);
                                setUploadedImages(next);
                              }}
                              aria-label="Mover imagem para direita"
                              title="Mover para direita"
                              disabled={idx >= uploadedImages.length - 1}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="glass rounded p-1 hover:brightness-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = uploadedImages.filter(u => u !== url);
                                setUploadedImages(next);
                                if (formData.image_url === url) {
                                  const newPrincipal = next[0] || '';
                                  setFormData({ ...formData, image_url: newPrincipal });
                                }
                              }}
                              aria-label="Excluir imagem desta galeria"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="featured">Produto em destaque</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingProduct ? "Atualizar" : "Criar"} Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                      {product.categories?.name || product.category || "Sem categoria"} • {product.brand}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Preço</p>
                    <p className="font-semibold">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estoque</p>
                    <p className="font-semibold">{product.stock} unidades</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold">{product.featured ? "Destaque" : "Normal"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
