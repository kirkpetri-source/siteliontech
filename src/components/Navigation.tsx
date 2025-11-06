import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Shield, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { Cart } from "./Cart";
import logo from "@/assets/logo-lion-tech.jpg";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { newOrdersCount } = useOrderNotifications();

  const navItems = [
    { label: "Início", href: "/" },
    { label: "Serviços", href: "/servicos" },
    { label: "Loja", href: "/loja" },
    { label: "Cases", href: "/cases" },
    { label: "Sobre", href: "/sobre" },
    { label: "Contato", href: "/contato" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 hover-scale">
            <img src={logo} alt="Lion Tech" className="h-12 w-12 object-contain rounded-lg" />
            <div>
              <div className="font-bold text-xl text-foreground">LION TECH</div>
              <div className="text-xs text-muted-foreground">Soluções em TI</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-accent/50 transition-all flex items-center gap-2 relative"
              >
                <Shield className="h-4 w-4" />
                Dashboard
                {newOrdersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                  >
                    {newOrdersCount}
                  </Badge>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="ml-4">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
            <div className="ml-4">
              <Cart />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent/50 text-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-accent/50 transition-all relative"
              >
                <Shield className="h-4 w-4" />
                Dashboard
                {newOrdersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                  >
                    {newOrdersCount}
                  </Badge>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
            <div className="pt-2">
              <Cart />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
