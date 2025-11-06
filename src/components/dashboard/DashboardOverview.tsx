import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertCircle } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

interface OverviewStats {
  totalOrders: number;
  monthlyRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  pendingOrders: number;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalOrders: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchOverviewStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get monthly orders
      const { data: monthOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (ordersError) throw ordersError;

      const monthlyRevenue = monthOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingOrders = monthOrders?.filter(o => o.status === 'pending').length || 0;

      // Get all orders count
      const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get low stock products (stock <= 5)
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 5);

      setStats({
        totalOrders: totalOrdersCount || 0,
        monthlyRevenue,
        totalProducts: productsCount || 0,
        lowStockCount: lowStockCount || 0,
        pendingOrders,
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();

    // Real-time updates
    const channel = supabase
      .channel('overview-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => fetchOverviewStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => fetchOverviewStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Visão Geral</h2>
        <p className="text-muted-foreground">Principais métricas do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingOrders} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {stats.monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita mensal
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No catálogo
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos com estoque ≤ 5
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Pedidos Totais</p>
              <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Faturamento Mensal</p>
              <p className="text-3xl font-bold text-primary">R$ {stats.monthlyRevenue.toFixed(2)}</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Produtos Ativos</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>
          
          {stats.lowStockCount > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Atenção: Estoque Baixo</p>
                <p className="text-sm text-muted-foreground">
                  {stats.lowStockCount} produto{stats.lowStockCount > 1 ? 's' : ''} com estoque baixo. 
                  Verifique o inventário para evitar rupturas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
