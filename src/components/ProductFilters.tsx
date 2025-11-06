import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  categories: string[];
  brands: string[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  categories,
  brands,
  showFilters,
  setShowFilters,
}: ProductFiltersProps) => {
  const activeFiltersCount = [
    selectedCategory !== "Todos",
    selectedBrand !== "Todos",
    searchTerm !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 glass border-primary/20 focus:border-primary"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="md:w-auto h-12 gap-2"
        >
          <SlidersHorizontal className="h-5 w-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass rounded-2xl p-6 space-y-6 animate-fade-in">
          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              Categorias
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="hover-scale"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              Marcas
            </h3>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Button
                  key={brand}
                  variant={selectedBrand === brand ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBrand(brand)}
                  className="hover-scale"
                >
                  {brand}
                </Button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todos");
                setSelectedBrand("Todos");
              }}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
