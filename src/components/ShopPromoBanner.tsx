import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import heroTech from "@/assets/hero-tech.jpg";

interface ShopBanner {
  id: string;
  image_url: string;
  title?: string | null;
  link?: string | null;
  active: boolean;
  display_order: number;
}

export const ShopPromoBanner = () => {
  const [banners, setBanners] = useState<ShopBanner[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const fetchBanners = useCallback(async () => {
    const { data, error } = await supabase
      .from('shop_banners' as any)
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (!error) setBanners((data as any) || []);
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (banners.length === 0) {
    return (
      <div className="relative">
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="flex">
            <div className="min-w-0 flex-[0_0_100%]">
              <div className="relative w-full aspect-[3/1]">
                <img
                  src={heroTech}
                  alt={'Banner exemplo'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent text-white">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-300" />
                    <span className="font-semibold text-sm md:text-base">
                      Exemplo de Banner (3240×1080 recomendado)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <a
                href={banner.link || undefined}
                target={banner.link ? "_blank" : undefined}
                rel={banner.link ? "noopener noreferrer" : undefined}
                className="block"
              >
                <div className="relative w-full aspect-[3/1]">
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Promoção'}
                    className="h-full w-full object-cover"
                  />
                  {banner.title && (
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent text-white">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-300" />
                        <span className="font-semibold text-sm md:text-base">
                          {banner.title}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none">
        <Button
          variant="glass"
          size="icon"
          onClick={scrollPrev}
          className="pointer-events-auto"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="glass"
          size="icon"
          onClick={scrollNext}
          className="pointer-events-auto"
          aria-label="Próximo slide"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ShopPromoBanner;