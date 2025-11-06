import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

interface Stats {
  totalContacts: number;
  totalProducts: number;
  totalStock: number;
  averagePrice: number;
}

export const SalesStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    totalProducts: 0,
    totalStock: 0,
    averagePrice: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Get products stats
      const { data: products } = await supabase
        .from('products')
        .select('price, stock');

      const totalProducts = products?.length || 0;
      const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) || 0;
      const averagePrice = products && products.length > 0
        ? products.reduce((sum, p) => sum + Number(p.price), 0) / products.length
        : 0;

      setStats({
        totalContacts: contactsCount || 0,
        totalProducts,
        totalStock,
        averagePrice,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock}</div>
            <p className="text-xs text-muted-foreground">
              Unidades disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.averagePrice.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio dos produtos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Sistema</CardTitle>
          <CardDescription>
            Visão geral da sua loja Lion Tech
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taxa de resposta</span>
              <span className="font-semibold">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tempo médio de resposta</span>
              <span className="font-semibold">2 horas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Produtos em destaque</span>
              <span className="font-semibold">
                {stats.totalProducts > 0 ? Math.round(stats.totalProducts * 0.3) : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
