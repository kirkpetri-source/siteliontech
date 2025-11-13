import { ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  price: string;
  image?: string;
  onRequestQuote?: () => void;
  benefits?: string[];
  prerequisites?: string[];
}

export const ServiceCard = ({ title, description, icon: Icon, price, image, onRequestQuote, benefits, prerequisites }: ServiceCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-border/50">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-xl mt-4">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-2xl font-bold text-gradient font-mono">{price}</p>
        {(benefits && benefits.length > 0) && (
          <div className="mt-4">
            <p className="text-sm font-medium">Benefícios</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {benefits.slice(0,3).map((b, i) => (<li key={i}>{b}</li>))}
            </ul>
          </div>
        )}
        {(prerequisites && prerequisites.length > 0) && (
          <div className="mt-3">
            <p className="text-sm font-medium">Pré-requisitos</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {prerequisites.slice(0,3).map((p, i) => (<li key={i}>{p}</li>))}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="ghost" className="w-full group/btn">
          Saiba mais
          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
        <Button className="w-full" onClick={onRequestQuote}>Solicitar Orçamento</Button>
      </CardFooter>
    </Card>
  );
};
