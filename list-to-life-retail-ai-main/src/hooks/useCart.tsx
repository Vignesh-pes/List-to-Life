import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  cart_id: string;
  product_id: string;
  quantity: number;
  product: {
    product_name: string;
    price: number;
    image_url: string;
    current_stock?: number;
  };
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carts')
        .select(`
          cart_id,
          product_id,
          quantity,
          products(
            product_name,
            price,
            image_url,
            inventory(current_stock)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedItems = data.map(item => ({
        ...item,
        product: {
          ...item.products,
          current_stock: item.products?.inventory?.[0]?.current_stock || 0
        }
      }));

      setCartItems(formattedItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cart: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('carts')
          .update({ quantity: existing.quantity + quantity })
          .eq('cart_id', existing.cart_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('carts')
          .insert({
            cart_id: crypto.randomUUID(),
            user_id: user.id,
            product_id: productId,
            quantity
          });

        if (error) throw error;
      }

      await fetchCart();
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add to cart: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartId);
      return;
    }

    try {
      const { error } = await supabase
        .from('carts')
        .update({ quantity })
        .eq('cart_id', cartId);

      if (error) throw error;
      await fetchCart();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update quantity: " + error.message,
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartId: string) => {
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;
      await fetchCart();
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove from cart: " + error.message,
        variant: "destructive",
      });
    }
  };
  
  const clearCart = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchCart();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear cart: " + error.message,
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    total,
    refetch: fetchCart
  };
};
