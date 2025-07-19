import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  image_url: string;
  description: string;
  attributes: any;
  current_stock?: number;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory(current_stock)
        `);

      if (error) throw error;

      const formattedProducts = data.map(product => ({
        ...product,
        current_stock: product.inventory?.[0]?.current_stock || 0
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch products: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Set up real-time subscription for inventory updates
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          fetchProducts(); // Refetch products when inventory changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products, loading, refetch: fetchProducts };
};