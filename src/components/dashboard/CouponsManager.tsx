import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Tag, Calendar, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string()
    .trim()
    .min(3, "Código deve ter no mínimo 3 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive("Valor deve ser positivo"),
  min_purchase: z.number().min(0, "Valor mínimo não pode ser negativo"),
  max_uses: z.number().int().positive("Máximo de usos deve ser positivo").optional().nullable(),
  valid_until: z.string().optional().nullable(),
  active: z.boolean(),
}).refine((data) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    return false;
  }
  return true;
}, {
  message: "Porcentagem não pode ser maior que 100%",
  path: ["discount_value"],
});

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export const CouponsManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "0",
    max_uses: "",
    valid_until: "",
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      const validatedData = couponSchema.parse({
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase: parseFloat(formData.min_purchase),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null,
        active: formData.active,
      });
      setErrors({});
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validatedData = validateForm();
    if (!validatedData) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    try {
      const couponData: any = {
        code: validatedData.code,
        discount_type: validatedData.discount_type,
        discount_value: validatedData.discount_value,
        min_purchase: validatedData.min_purchase,
        max_uses: validatedData.max_uses,
        valid_until: validatedData.valid_until,
        active: validatedData.active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: "Cupom atualizado!",
          description: "O cupom foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (error) throw error;

        toast({
          title: "Cupom criado!",
          description: "O cupom foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o cupom.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cupom excluído!",
        description: "O cupom foi removido com sucesso.",
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_uses: coupon.max_uses?.toString() || "",
      valid_until: coupon.valid_until || "",
      active: coupon.active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase: "0",
      max_uses: "",
      valid_until: "",
      active: true,
    });
    setErrors({});
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
        <h2 className="text-2xl font-bold">Gerenciar Cupons</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="DESCONTO10"
                    maxLength={20}
                    required
                  />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                  <select
                    id="discount_type"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                  {errors.discount_value && <p className="text-sm text-destructive">{errors.discount_value}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Compra Mínima (R$)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    step="0.01"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Máximo de Usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">Válido Até</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="active">Cupom ativo</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingCoupon ? "Atualizar" : "Criar"} Cupom
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cupom cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="glass rounded-lg p-3">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {coupon.code}
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% de desconto`
                          : `R$ ${coupon.discount_value.toFixed(2)} de desconto`
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Compra Mínima
                    </p>
                    <p className="font-semibold">R$ {coupon.min_purchase.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Usos</p>
                    <p className="font-semibold">
                      {coupon.current_uses} / {coupon.max_uses || '∞'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Validade
                    </p>
                    <p className="font-semibold">
                      {coupon.valid_until 
                        ? format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })
                        : "Sem limite"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p className="font-semibold">
                      {format(new Date(coupon.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
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
