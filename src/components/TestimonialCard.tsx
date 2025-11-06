import { Star } from "lucide-react";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Testimonial } from "@/lib/mockData";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  return (
    <Card className="p-6 glass hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < testimonial.rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <p className="text-muted-foreground italic mb-6 flex-1">
        "{testimonial.content}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={testimonial.image} alt={testimonial.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {testimonial.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </Card>
  );
};
