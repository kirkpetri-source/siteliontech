import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import logo from "@/assets/logo-lion-tech.jpg";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Lion Tech" className="h-12 w-12 object-contain rounded-lg" />
              <div>
                <div className="font-bold text-lg">LION TECH</div>
                <div className="text-xs text-muted-foreground">Soluções em TI</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Assistência técnica especializada e loja completa de informática em Mineiros-GO.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/servicos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Serviços</Link></li>
              <li><Link to="/loja" className="text-sm text-muted-foreground hover:text-primary transition-colors">Loja</Link></li>
              <li><Link to="/casos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cases</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="tel:+5564999555364" className="text-muted-foreground hover:text-primary transition-colors">
                  (64) 9 9955-5364
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Mineiros-GO</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">contato@liontech.com.br</span>
              </li>
            </ul>
          </div>

          {/* Horário */}
          <div>
            <h3 className="font-semibold mb-4">Horário de Atendimento</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Segunda - Sexta</p>
                  <p className="font-mono text-xs text-primary">08:00 - 18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Sábado</p>
                  <p className="font-mono text-xs text-primary">08:00 - 12:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Lion Tech. Todos os direitos reservados. CNPJ: 44.124.574/0001-47
          </p>
          <div className="flex gap-4">
            <Link to="/politicas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Políticas de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
