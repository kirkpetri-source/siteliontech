import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsList } from "@/components/dashboard/ContactsList";
import { ProductsManager } from "@/components/dashboard/ProductsManager";
import { CouponsManager } from "@/components/dashboard/CouponsManager";
import { SalesStats } from "@/components/dashboard/SalesStats";
import { OrdersList } from "@/components/dashboard/OrdersList";
import { Shield, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">Dashboard Admin</h1>
                <p className="text-muted-foreground">Gerencie sua loja Lion Tech</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 max-w-4xl">
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="contacts">Contatos</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="coupons">Cupons</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <OrdersList />
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <ContactsList />
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <ProductsManager />
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4">
              <CouponsManager />
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <SalesStats />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
