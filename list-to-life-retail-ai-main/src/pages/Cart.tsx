import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';

const Cart = () => {
  const { cartItems, loading, updateQuantity, removeFromCart, subtotal, tax, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Please sign in</h3>
            <p className="text-muted-foreground mb-6">
              Sign in to view your cart and continue shopping
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-muted-foreground">Loading cart...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            Review your items and proceed to checkout
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.cart_id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop'}
                          alt={item.product.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{item.product.product_name}</h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            {item.product.current_stock || 0} in stock
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="px-3 py-1 text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => removeFromCart(item.cart_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${item.product.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/checkout')}>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <div className="text-center">
                    <Link to="/products">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to add items to your cart
            </p>
            <Link to="/products">
              <Button variant="hero" size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
