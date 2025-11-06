import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Package, TrendingUp, History, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  stock: number;
  category: string;
  brand: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
  products: {
    name: string;
  };
}

export const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [movementType, setMovementType] = useState<string>("restock");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchMovements();

    // Subscribe to real-time updates
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    const movementsChannel = supabase
      .channel('movements-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, () => {
        fetchMovements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('stock', { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMovements(data || []);
    }
  };

  const recordMovement = async () => {
    if (!selectedProduct || !quantity) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.rpc('record_stock_movement', {
      p_product_id: selectedProduct,
      p_type: movementType,
      p_quantity: parseInt(quantity),
      p_notes: notes || null,
    });

    if (error) {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Movimentação registrada",
        description: "Estoque atualizado com sucesso",
      });
      setDialogOpen(false);
      setSelectedProduct("");
      setQuantity("");
      setNotes("");
      fetchProducts();
      fetchMovements();
    }
  };

  const getLowStockProducts = () => products.filter(p => p.stock <= 5);
  
  const getReplenishmentForecast = (product: Product) => {
    const recentSales = movements.filter(
      m => m.product_id === product.id && m.type === 'sale'
    ).slice(0, 10);
    
    if (recentSales.length === 0) return null;
    
    const avgDailySales = recentSales.reduce((sum, m) => sum + m.quantity, 0) / 7;
    const daysUntilStockout = product.stock / avgDailySales;
    
    return {
      avgDailySales: avgDailySales.toFixed(1),
      daysUntilStockout: Math.floor(daysUntilStockout),
      suggestedRestock: Math.ceil(avgDailySales * 14),
    };
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      sale: 'Venda',
      restock: 'Reposição',
      adjustment: 'Ajuste',
      return: 'Devolução',
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: { [key: string]: "destructive" | "default" | "secondary" | "outline" } = {
      sale: 'destructive',
      restock: 'default',
      adjustment: 'secondary',
      return: 'outline',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando inventário...</div>;
  }

  const lowStockProducts = getLowStockProducts();

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque Baixo
            </CardTitle>
            <CardDescription>
              {lowStockProducts.length} produto(s) com estoque crítico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.brand} - {product.category}</p>
                  </div>
                  <Badge variant="destructive">
                    {product.stock} unidades
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Levels Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Níveis de Estoque
            </CardTitle>
            <CardDescription>Visualização geral do inventário</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimentação de Estoque</DialogTitle>
                <DialogDescription>
                  Adicione entrada, saída ou ajuste de estoque
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Estoque atual: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Movimentação</Label>
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Reposição</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                      <SelectItem value="return">Devolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalhes sobre a movimentação..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={recordMovement}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Previsão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const forecast = getReplenishmentForecast(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stock <= 5 ? "destructive" : "default"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {forecast ? (
                        <div className="text-sm">
                          <div className="flex items-center justify-end gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {forecast.avgDailySales}/dia
                          </div>
                          {forecast.daysUntilStockout < 7 && (
                            <div className="text-destructive">
                              ~{forecast.daysUntilStockout} dias restantes
                            </div>
                          )}
                          <div className="text-primary">
                            Sugestão: +{forecast.suggestedRestock}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem dados</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
          <CardDescription>Últimas 50 movimentações de estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Estoque Anterior</TableHead>
                <TableHead className="text-right">Novo Estoque</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{movement.products.name}</TableCell>
                  <TableCell>
                    <Badge variant={getMovementTypeColor(movement.type)}>
                      {getMovementTypeLabel(movement.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{movement.quantity}</TableCell>
                  <TableCell className="text-right">{movement.previous_stock}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={movement.new_stock <= 5 ? "destructive" : "default"}>
                      {movement.new_stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.notes || '-'}
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
