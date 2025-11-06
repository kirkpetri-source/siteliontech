import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

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
    <Card className="overflow-hidden group hover:shadow-elegant transition-all duration-300">
      {/* Before/After Slider */}
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
        {/* Before Image (Background) */}
        <div className="absolute inset-0">
          <img src={beforeImage} alt="Antes" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-destructive text-white">Antes</Badge>
          </div>
        </div>

        {/* After Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden transition-all"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={afterImage} alt="Depois" className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-primary text-white">Depois</Badge>
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
  );
};
