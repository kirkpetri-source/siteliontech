import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Maximize2 } from "lucide-react";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  title: string;
  description: string;
  category: string;
}

export const BeforeAfter = ({ beforeImage, afterImage, title, description, category }: BeforeAfterProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  return (
    <Dialog>
      <Card className="overflow-hidden group hover:shadow-elegant transition-all duration-300">
        {/* Before/After Slider */}
        <div className="relative">
          <div
            className="relative h-80 overflow-hidden cursor-ew-resize select-none touch-none"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
          >
            {/* After Image (Background) - Now on the right side */}
            <div className="absolute inset-0">
              <img src={afterImage} alt="Depois" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-primary text-white">Depois</Badge>
              </div>
            </div>

            {/* Before Image (Clipped) - Now on the left side */}
            <div
              className="absolute inset-0 overflow-hidden transition-all"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img src={beforeImage} alt="Antes" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-destructive text-white">Antes</Badge>
              </div>
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-glow z-20"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Expand Button */}
          <DialogTrigger asChild>
            <button className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background p-2 rounded-full transition-all hover:scale-110">
              <Maximize2 className="w-5 h-5" />
            </button>
          </DialogTrigger>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                {category}
              </Badge>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {title}
              </h3>
            </div>
          </div>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </Card>

      {/* Modal for expanded view */}
      <DialogContent className="max-w-6xl w-full p-0 overflow-hidden">
        <div
          className="relative h-[80vh] overflow-hidden cursor-ew-resize select-none touch-none"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
        >
          {/* After Image (Background) - Right side */}
          <div className="absolute inset-0">
            <img src={afterImage} alt="Depois" className="w-full h-full object-cover" />
            <div className="absolute top-6 right-6 z-10">
              <Badge className="bg-primary text-white text-lg px-4 py-2">Depois</Badge>
            </div>
          </div>

          {/* Before Image (Clipped) - Left side */}
          <div
            className="absolute inset-0 overflow-hidden transition-all"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img src={beforeImage} alt="Antes" className="w-full h-full object-cover" />
            <div className="absolute top-6 left-6 z-10">
              <Badge className="bg-destructive text-white text-lg px-4 py-2">Antes</Badge>
            </div>
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-glow z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Content Info */}
        <div className="p-6 bg-background">
          <Badge variant="outline" className="mb-2">
            {category}
          </Badge>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
