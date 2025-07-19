import React, { useState } from 'react';
import { Heart, ShoppingCart, Trash2, Search } from 'lucide-react';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

// Mock wishlist data
const mockWishlistItems = [
  {
    id: '1',
    name: 'Samsung 55" 4K Smart TV',
    price: 499.99,
    image: 'https://images.unsplash.com/photo-1593305841991-2b567f6b6d7e?w=400&h=400&fit=crop',
    category: 'Electronics',
    stock: 15,
    rating: 4.5,
    originalPrice: 599.99
  },
  {
    id: '2',
    name: 'Women\'s Athletic Leggings',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1575052814086-f9e4d0eb1370?w=400&h=400&fit=crop',
    category: 'Clothing',
    stock: 75,
    rating: 4.6,
    originalPrice: 34.99
  },
  {
    id: '3',
    name: 'Stainless Steel Cookware Set',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop',
    category: 'Home',
    stock: 20,
    rating: 4.3,
    originalPrice: 159.99
  },
  {
    id: '4',
    name: 'HP Pavilion Laptop',
    price: 799.99,
    image: 'https://images.unsplash.com/photo-1587613750950-9e5b7c8ae0e9?w=400&h=400&fit=crop',
    category: 'Electronics',
    stock: 3,
    rating: 4.3,
    originalPrice: 899.99
  }
];

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = wishlistItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addToCart = (itemId: string) => {
    // TODO: Implement add to cart functionality
    console.log(`Added item ${itemId} to cart`);
  };

  const addAllToCart = () => {
    // TODO: Implement add all to cart functionality
    console.log('Added all wishlist items to cart');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            Keep track of items you want to buy later
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="relative max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search wishlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filteredItems.length > 0 && (
            <Button onClick={addAllToCart} variant="hero">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add All to Cart
            </Button>
          )}
        </div>

        {/* Wishlist Items */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.stock < 10 && (
                    <Badge variant="secondary" className="absolute top-2 left-2 bg-warning text-warning-foreground">
                      Low Stock
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      {item.stock} in stock
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{item.rating}</span>
                      <span className="text-warning">★</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="cart"
                      className="flex-1"
                      onClick={() => addToCart(item.id)}
                      disabled={item.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No items found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Start adding items you love to your wishlist'
              }
            </p>
            {!searchTerm && (
              <Button variant="hero" size="lg">
                Start Shopping
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;