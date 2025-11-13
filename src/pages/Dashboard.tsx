import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ContactsList } from "@/components/dashboard/ContactsList";
import { ProductsManager } from "@/components/dashboard/ProductsManager";
import { CouponsManager } from "@/components/dashboard/CouponsManager";
import { SalesStats } from "@/components/dashboard/SalesStats";
import { OrdersList } from "@/components/dashboard/OrdersList";
import { InventoryManager } from "@/components/dashboard/InventoryManager";
import { BackupsManager } from "@/components/dashboard/BackupsManager";
import { CategoriesManager } from "@/components/dashboard/CategoriesManager";
import { ServicesManager } from "@/components/dashboard/ServicesManager";
import { CasesManager } from "@/components/dashboard/CasesManager";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ChatTicketsManager } from "@/components/dashboard/ChatTicketsManager";
import { BusinessHoursManager } from "@/components/dashboard/BusinessHoursManager";
import { AutoResponsesManager } from "@/components/dashboard/AutoResponsesManager";
import { ShopBannerManager } from "@/components/dashboard/ShopBannerManager";
import {
  Shield, 
  LogOut, 
  ShoppingCart, 
  Package, 
  FileText, 
  Tag, 
  MessageSquare, 
  Settings,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { markAsRead } = useOrderNotifications();
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    // Mark notifications as read when viewing dashboard
    markAsRead();
  }, [markAsRead]);

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

          {/* Menu de Navegação */}
          <div className="flex flex-wrap gap-2 mb-8 p-4 glass rounded-xl">
            <Button
              variant={activeSection === "overview" ? "default" : "ghost"}
              onClick={() => setActiveSection("overview")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </Button>

            <Button
              variant={activeSection === "orders" ? "default" : "ghost"}
              onClick={() => setActiveSection("orders")}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </Button>

            <Button
              variant={activeSection === "stats" ? "default" : "ghost"}
              onClick={() => setActiveSection("stats")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Estatísticas
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={["products", "categories", "inventory"].includes(activeSection) ? "default" : "ghost"}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Produtos
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setActiveSection("products")} className="cursor-pointer">
                  <Package className="h-4 w-4 mr-2" />
                  Gerenciar Produtos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("categories")} className="cursor-pointer">
                  <Tag className="h-4 w-4 mr-2" />
                  Categorias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("inventory")} className="cursor-pointer">
                  <Package className="h-4 w-4 mr-2" />
                  Inventário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={["services", "cases"].includes(activeSection) ? "default" : "ghost"}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Conteúdo
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setActiveSection("services")} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Serviços
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("cases")} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Cases de Sucesso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={activeSection === "coupons" ? "default" : "ghost"}
              onClick={() => setActiveSection("coupons")}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Cupons
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={["contacts", "chat", "business-hours", "auto-responses"].includes(activeSection) ? "default" : "ghost"}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Comunicação
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setActiveSection("chat")} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat / Tickets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("business-hours")} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Horário de Funcionamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("auto-responses")} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respostas Automáticas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("contacts")} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Formulário Contato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={["backups", "shop-banner"].includes(activeSection) ? "default" : "ghost"}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setActiveSection("shop-banner")} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Banner da Loja
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("backups")} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Backups
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Conteúdo das Seções */}
          <div className="space-y-6">
            {activeSection === "overview" && <DashboardOverview />}
            {activeSection === "orders" && <OrdersList />}
            {activeSection === "stats" && <SalesStats />}
            {activeSection === "products" && <ProductsManager />}
            {activeSection === "categories" && <CategoriesManager />}
            {activeSection === "inventory" && <InventoryManager />}
            {activeSection === "services" && <ServicesManager />}
            {activeSection === "cases" && <CasesManager />}
            {activeSection === "coupons" && <CouponsManager />}
            {activeSection === "chat" && <ChatTicketsManager />}
            {activeSection === "business-hours" && <BusinessHoursManager />}
            {activeSection === "auto-responses" && <AutoResponsesManager />}
            {activeSection === "contacts" && <ContactsList />}
            {activeSection === "shop-banner" && <ShopBannerManager />}
            {activeSection === "backups" && <BackupsManager />}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
