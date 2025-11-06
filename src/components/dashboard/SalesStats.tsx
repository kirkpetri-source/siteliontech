import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, ShoppingCart, Package, TrendingDown, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  conversionRate: number;
}

interface MonthlyStats {
  totalRevenue: number;
  totalOrders: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

interface HourlySales {
  hour: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SalesStats = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    conversionRate: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalRevenue: 0,
    totalOrders: 0,
    previousMonthRevenue: 0,
    revenueGrowth: 0,
  });
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (todayError) throw todayError;

      // Calculate daily stats
      const totalRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalOrders = todayOrders?.length || 0;
      const pendingOrders = todayOrders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = todayOrders?.filter(o => o.status === 'completed').length || 0;

      // Get total contacts for conversion rate
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      const conversionRate = contactsCount && contactsCount > 0 
        ? (totalOrders / contactsCount) * 100 
        : 0;

      setDailyStats({
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        pendingOrders,
        completedOrders,
        conversionRate,
      });

      // Get monthly stats
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const monthlyRevenue = monthOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Get previous month for comparison
      const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

      const { data: prevMonthOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevMonthStart.toISOString())
        .lte('created_at', prevMonthEnd.toISOString());

      const prevMonthRevenue = prevMonthOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const revenueGrowth = prevMonthRevenue > 0 
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      setMonthlyStats({
        totalRevenue: monthlyRevenue,
        totalOrders: monthOrders?.length || 0,
        previousMonthRevenue: prevMonthRevenue,
        revenueGrowth,
      });

      // Get hourly sales for today
      const hourlyData: { [key: string]: { revenue: number; orders: number } } = {};
      
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        hourlyData[hourStr] = { revenue: 0, orders: 0 };
      }

      todayOrders?.forEach(order => {
        const hour = format(new Date(order.created_at), 'HH');
        hourlyData[hour].revenue += Number(order.total);
        hourlyData[hour].orders += 1;
      });

      const hourlySalesArray = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: `${hour}h`,
        revenue: data.revenue,
        orders: data.orders,
      }));

      setHourlySales(hourlySalesArray);

      // Get top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, total, order_id')
        .gte('created_at', monthStart.toISOString());

      if (orderItems) {
        const productStats: { [key: string]: { quantity: number; revenue: number } } = {};

        orderItems.forEach(item => {
          if (!productStats[item.product_name]) {
            productStats[item.product_name] = { quantity: 0, revenue: 0 };
          }
          productStats[item.product_name].quantity += item.quantity;
          productStats[item.product_name].revenue += Number(item.total);
        });

        const topProductsArray = Object.entries(productStats)
          .map(([name, stats]) => ({
            name,
            quantity: stats.quantity,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopProducts(topProductsArray);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Real-time updates
    const channel = supabase
      .channel('sales-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchStats();
        }
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
      {/* Daily KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {dailyStats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyStats.totalOrders} pedidos hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dailyStats.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyStats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Contatos → Vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Pedidos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyStats.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendentes / {dailyStats.completedOrders} concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Mensal</CardTitle>
          <CardDescription>
            Comparação com o mês anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Receita do Mês</p>
              <p className="text-3xl font-bold text-primary">
                R$ {monthlyStats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyStats.totalOrders} pedidos
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Mês Anterior</p>
              <p className="text-2xl font-semibold">
                R$ {monthlyStats.previousMonthRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Crescimento</p>
              <div className="flex items-center gap-2">
                {monthlyStats.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <p className={`text-2xl font-bold ${
                  monthlyStats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {monthlyStats.revenueGrowth >= 0 ? '+' : ''}
                  {monthlyStats.revenueGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Hourly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Hora (Hoje)</CardTitle>
            <CardDescription>
              Receita ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Top 5 do mês por receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes dos Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 glass rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    R$ {product.revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receita total
                  </p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venda registrada ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
