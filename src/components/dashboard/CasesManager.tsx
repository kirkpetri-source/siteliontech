import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Case {
  id: string;
  title: string;
  description: string | null;
  before_image: string;
  after_image: string;
  active: boolean;
  display_order: number;
}

export const CasesManager = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    before_image: "",
    after_image: "",
    active: true,
    display_order: 0,
  });
  const [beforeImageFile, setBeforeImageFile] = useState<File | null>(null);
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCases((data as any) || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let beforeImageUrl = formData.before_image;
      let afterImageUrl = formData.after_image;

      // Upload before image if new file selected
      if (beforeImageFile) {
        beforeImageUrl = await uploadImage(beforeImageFile, 'cases/before');
      }

      // Upload after image if new file selected
      if (afterImageFile) {
        afterImageUrl = await uploadImage(afterImageFile, 'cases/after');
      }

      const caseData = {
        title: formData.title,
        description: formData.description || null,
        before_image: beforeImageUrl,
        after_image: afterImageUrl,
        active: formData.active,
        display_order: formData.display_order,
      };

      if (editingCase) {
        const { error } = await supabase
          .from('cases' as any)
          .update(caseData)
          .eq('id', editingCase.id);

        if (error) throw error;
        toast({ title: "Case atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('cases' as any)
          .insert([caseData]);

        if (error) throw error;
        toast({ title: "Case criado com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCases();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este case?")) return;

    try {
      const { error } = await supabase
        .from('cases' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Case excluído com sucesso!" });
      fetchCases();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (caseItem: Case) => {
    setEditingCase(caseItem);
    setFormData({
      title: caseItem.title,
      description: caseItem.description || "",
      before_image: caseItem.before_image,
      after_image: caseItem.after_image,
      active: caseItem.active,
      display_order: caseItem.display_order,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCase(null);
    setBeforeImageFile(null);
    setAfterImageFile(null);
    setFormData({
      title: "",
      description: "",
      before_image: "",
      after_image: "",
      active: true,
      display_order: 0,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Gerenciar Cases
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Novo Case</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="cases-dialog-desc">
                <DialogHeader>
                  <DialogTitle>{editingCase ? "Editar Case" : "Novo Case"}</DialogTitle>
                </DialogHeader>
                <p id="cases-dialog-desc" className="sr-only">Formulário para criar ou editar cases com imagens antes e depois.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="before_image">Imagem Antes *</Label>
                      <Input
                        id="before_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBeforeImageFile(file);
                        }}
                        required={!formData.before_image && !editingCase}
                      />
                      {formData.before_image && (
                        <p className="text-xs text-muted-foreground">Imagem atual carregada</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="after_image">Imagem Depois *</Label>
                      <Input
                        id="after_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAfterImageFile(file);
                        }}
                        required={!formData.after_image && !editingCase}
                      />
                      {formData.after_image && (
                        <p className="text-xs text-muted-foreground">Imagem atual carregada</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Ordem</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="active">Status</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="active"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                        />
                        <Label>{formData.active ? "Ativo" : "Inativo"}</Label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? "Fazendo upload..." : editingCase ? "Atualizar" : "Criar"} Case
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{caseItem.description || "-"}</TableCell>
                  <TableCell>{caseItem.display_order}</TableCell>
                  <TableCell>
                    {caseItem.active ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(caseItem)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(caseItem.id)}>
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
    </div>
  );
};
