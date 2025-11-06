import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price: string | null;
  image_url: string | null;
  active: boolean;
  display_order: number;
}

const iconOptions = [
  "Wrench", "Monitor", "Cpu", "Smartphone", "Network", "Users", 
  "HardDrive", "Shield", "Zap", "Settings", "Server", "Database"
];

export const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Wrench",
    price: "",
    image_url: "",
    active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices((data as any) || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon,
        price: formData.price || null,
        image_url: formData.image_url || null,
        active: formData.active,
        display_order: formData.display_order,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services' as any)
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        toast({ title: "Serviço atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('services' as any)
          .insert([serviceData]);

        if (error) throw error;
        toast({ title: "Serviço criado com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      const { error } = await supabase
        .from('services' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Serviço excluído com sucesso!" });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      icon: service.icon || "Wrench",
      price: service.price || "",
      image_url: service.image_url || "",
      active: service.active,
      display_order: service.display_order,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      icon: "Wrench",
      price: "",
      image_url: "",
      active: true,
      display_order: 0,
    });
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wrench;
    return <Icon className="h-5 w-5" />;
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
              <Wrench className="h-5 w-5" />
              Gerenciar Serviços
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Novo Serviço</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
                </DialogHeader>
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
                      <Label htmlFor="price">Preço</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Ex: A partir de R$ 150"
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
                      <Label htmlFor="icon">Ícone</Label>
                      <select
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {editingService ? "Atualizar" : "Criar"} Serviço
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
                <TableHead>Ícone</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{getIconComponent(service.icon || "Wrench")}</TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.price || "-"}</TableCell>
                  <TableCell>{service.display_order}</TableCell>
                  <TableCell>
                    {service.active ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(service.id)}>
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
