import React from 'react';
import { Star, ShoppingCart, Heart, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const isLowStock = (product.current_stock || 0) < 10;
  const isOutOfStock = (product.current_stock || 0) === 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/10 hover:border-primary/30">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop'}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {isLowStock && !isOutOfStock && (
          <Badge variant="secondary" className="absolute top-2 left-2 bg-warning text-warning-foreground">
            Low Stock
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Out of Stock
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {product.subcategory}
          </div>
        </div>

        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.product_name}
        </h3>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < 4
                    ? 'text-warning fill-warning'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            4.0 (0)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.current_stock || 0} in stock
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="hero"
            className="flex-1"
            disabled={isOutOfStock}
            onClick={() => addToCart(product.product_id)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;