import { Product } from '@/types';
import { Card, CardContent } from './Card';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="text-3xl sm:text-4xl mb-2">{product.image}</div>
          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <div className="flex flex-col items-center w-full mt-2">
            <div className="text-xs text-muted-foreground mb-1">
              💵 {formatCurrency(product.cashPrice)} | 💳 {formatCurrency(product.cardPrice)}
            </div>
          </div>
          <button
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors w-full"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <Plus className="h-4 w-4 mx-auto" />
          </button>
          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
        </div>
      </CardContent>
    </Card>
  );
}
