import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Edit, Trash2 } from "lucide-react";
import heroTechUrl from "@/assets/hero-tech.jpg";

interface ShopBanner {
  id: string;
  image_url: string;
  title: string | null;
  link: string | null;
  active: boolean;
  display_order: number;
}

export const ShopBannerManager = () => {
  const [banners, setBanners] = useState<ShopBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopBanner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [missingTable, setMissingTable] = useState(false);
  

  const [form, setForm] = useState({
    title: "",
    link: "",
    display_order: 0,
    active: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_banners' as any)
        .select('*')
        .order('display_order', { ascending: true });
      if (error) {
        // Detect table not found (404 on PostgREST) or relation missing
        if ((error as any).code === '404' || String(error.message).toLowerCase().includes('shop_banners')) {
          setMissingTable(true);
        }
        throw error;
      }
      setBanners((data as any) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop();
    const name = `${Math.random()}.${ext}`;
    const path = `shop-banners/${name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const createExampleBanner = async () => {
    if (missingTable) {
      toast({ title: "Tabela ausente", description: "Aplique a migração de shop_banners antes de criar o exemplo.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(heroTechUrl);
      const blob = await res.blob();
      const file = new File([blob], `exemplo-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const imageUrl = await uploadImage(file);

      const { error } = await supabase
        .from('shop_banners' as any)
        .insert([
          {
            title: 'Oferta Especial',
            link: null,
            display_order: 0,
            active: true,
            image_url: imageUrl,
          },
        ]);
      if (error) throw error;
      toast({ title: "Banner de exemplo criado" });
      fetchBanners();
    } catch (err: any) {
      toast({ title: "Erro ao criar exemplo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = editing?.image_url || "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const payload = {
        title: form.title || null,
        link: form.link || null,
        display_order: form.display_order,
        active: form.active,
        image_url: imageUrl || editing?.image_url || null,
      };
      if (editing) {
        const { error } = await supabase.from('shop_banners' as any).update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: "Banner atualizado" });
      } else {
        const { error } = await supabase.from('shop_banners' as any).insert([payload]);
        if (error) throw error;
        toast({ title: "Banner criado" });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    const { error } = await supabase.from('shop_banners' as any).delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner excluído" });
      fetchBanners();
    }
  };

  const handleEdit = (b: ShopBanner) => {
    setEditing(b);
    setForm({
      title: b.title || "",
      link: b.link || "",
      display_order: b.display_order,
      active: b.active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setImageFile(null);
    setForm({ title: "", link: "", display_order: 0, active: true });
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card className="hover-scale">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Banner da Loja
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={createExampleBanner} disabled={missingTable || uploading}>
              Criar Exemplo
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button disabled={missingTable}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Novo Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl" aria-describedby="shop-banner-dialog-desc">
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                  <DialogDescription>
                    Use imagens 3240×1080 (3:1) até 500KB. JPG/WEBP recomendados.
                  </DialogDescription>
                </DialogHeader>
                <p id="shop-banner-dialog-desc" className="sr-only">Formulário para criar ou editar banner da loja.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem</Label>
                  <Input id="image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Link (opcional)</Label>
                    <Input id="link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem</Label>
                    <Input id="display_order" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value || '0') })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
                      <span>{form.active ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>{uploading ? "Salvando..." : editing ? "Atualizar" : "Criar"}</Button>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          Tamanho recomendado: <span className="font-medium">3240×1080px</span> (3:1), JPG/WEBP até 500KB.
        </div>
        {missingTable && (
          <div className="mt-3 p-3 rounded-lg border bg-accent/20 text-sm">
            A tabela <code>shop_banners</code> não foi encontrada. Aplique a migração
            <code className="mx-1">supabase/migrations/20251111120000_shop_banners.sql</code> no projeto do Supabase (SQL Editor) e recarregue.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <img src={b.image_url} alt={b.title || 'Banner'} className="h-12 w-24 object-cover rounded" />
                </TableCell>
                <TableCell className="font-medium">{b.title || '-'}</TableCell>
                <TableCell>{b.link || '-'}</TableCell>
                <TableCell>{b.display_order}</TableCell>
                <TableCell>
                  {b.active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(b)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ShopBannerManager;