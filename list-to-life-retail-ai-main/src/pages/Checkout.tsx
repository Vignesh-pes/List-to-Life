import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Header from '../components/Header';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Map, Lightbulb, ShoppingCart } from 'lucide-react';

// --- Interfaces for the new data from our Flask API ---
interface ProcessedItem {
  product_id: string;
  name: string;
  quantity: number;
  original_price: number;
  final_price_per_unit: number;
  applied_discount_per_unit: number;
  substitute?: any;
  product_details: any;
}

interface DealResults {
  processed_items: ProcessedItem[];
  total_after_discount: number;
  total_discount: number;
  applied_deals_summary: string[];
}

interface OptimizedPathStep {
  product_id: string;
  location_node: string;
  product_name: string;
}

interface Recommendation {
  product_id: string;
  product_name: string;
  reason: string;
}

const API_URL = 'http://127.0.0.1:5000'; // Your Flask backend URL

const Checkout = () => {
  // We still use the original hooks for cart items and user auth
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- NEW: State to hold all the enhanced data fetched from our backend ---
  const [dealResults, setDealResults] = useState<DealResults | null>(null);
  const [optimizedPath, setOptimizedPath] = useState<OptimizedPathStep[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // --- NEW: This effect runs whenever the cartItems change to fetch all the extra data ---
  useEffect(() => {
    const fetchEnhancedData = async () => {
      if (!cartItems || cartItems.length === 0) {
        setDealResults(null);
        setOptimizedPath([]);
        setRecommendations([]);
        return;
      }

      setIsLoading(true);
      try {
        const baseShoppingList = cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }));

        // We run all API calls in parallel for better performance
        const [dealsResponse, pathResponse, recsResponse] = await Promise.all([
          // 1. Get detailed list with stock, substitutes, and deals applied
          axios.post(`${API_URL}/api/shopping-list-details`, { shopping_list: baseShoppingList }),
          // 2. Get the optimized path for the list
          axios.post(`${API_URL}/api/optimize-path`, { shopping_list: baseShoppingList }),
          // 3. Get recommendations based on the items in the cart
          axios.post(`${API_URL}/api/recommendations`, { product_ids: baseShoppingList.map(item => item.product_id) }),
        ]);

        setDealResults(dealsResponse.data);
        setOptimizedPath(pathResponse.data.optimized_path);
        setRecommendations(recsResponse.data.recommendations);

      } catch (error) {
        console.error("Failed to fetch enhanced cart data:", error);
        toast({ title: "Error", description: "Could not fetch optimized cart details from the AI server.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedData();
  }, [cartItems, toast]);

  // --- UPDATED: This function now uses the final discounted total from dealResults ---
  const handlePlaceOrder = async () => {
    if (isPlacingOrder || !dealResults) return;
    setIsPlacingOrder(true);

    if (!user) {
      toast({ title: "Please sign in to place an order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    const order_id = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    try {
      const { error: orderError } = await supabase.from('orders').insert({
        order_id,
        user_id: user.id,
        total_amount: dealResults.total_after_discount, // Use the final discounted total
        status: 'processing',
      });
      if (orderError) throw orderError;

      const orderItems = dealResults.processed_items.map(item => ({
        order_item_id: crypto.randomUUID(),
        order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.final_price_per_unit, // Use the final price per unit after discounts
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      const { error: stockUpdateError } = await supabase.functions.invoke('update-stock', {
        body: { cartItems: cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })) }
      });
      if (stockUpdateError) throw stockUpdateError;

      await clearCart();
      toast({ title: "Order Placed!", description: "Your order has been successfully placed." });
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: `There was an issue placing your order: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Checkout</h1>
          <p className="text-lg text-gray-500">Review your smart-optimized cart and get ready to shop!</p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Shipping and Payment Forms (Unchanged) */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader><CardTitle>Shipping Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="John" /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" placeholder="123 Main St" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="cardNumber">Card Number</Label><Input id="cardNumber" placeholder="**** **** **** 1234" /></div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Order Summary, Path, and Recommendations */}
            <div className="lg:col-span-1 space-y-8 sticky top-24">
              <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                  ) : dealResults ? (
                    <div className="space-y-4">
                      {dealResults.processed_items.map(item => (
                        <div key={item.product_id} className="flex justify-between items-center text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span className="font-medium">${(item.final_price_per_unit * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>${((dealResults.total_after_discount) + (dealResults.total_discount)).toFixed(2)}</span></div>
                        <div className="flex justify-between text-green-600 font-semibold"><span>Discounts</span><span>-${dealResults.total_discount.toFixed(2)}</span></div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${dealResults.total_after_discount.toFixed(2)}</span>
                      </div>
                      <Button variant="hero" size="lg" className="w-full mt-4" onClick={handlePlaceOrder} disabled={isPlacingOrder || isLoading}>
                        {isPlacingOrder ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing Order...</> : "Place Order"}
                      </Button>
                    </div>
                  ) : <p>Could not load cart details.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Map className="text-purple-500" /> Optimized Path</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-purple-500" /></div> : (
                    <ol className="space-y-3">
                      {optimizedPath.map((step, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold">{index + 1}</span>
                          <div>
                            <p className="font-semibold">{step.product_name}</p>
                            <p className="text-sm text-gray-500">Go to <strong>{step.location_node.replace(/_/g, ' ')}</strong></p>
                          </div>
                        </li>
                      ))}
                      <li className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold"><ShoppingCart /></span>
                        <p className="font-semibold">Proceed to Checkout</p>
                      </li>
                    </ol>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-500" /> You Might Also Need</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-yellow-500" /></div> : (
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div key={rec.product_id} className="flex justify-between items-center">
                          <span>{rec.product_name}</span>
                          <Button variant="outline" size="sm">Add</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold">Your cart is empty.</h3>
            <Link to="/products">
              <Button variant="default" className="mt-4">Start Shopping</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
