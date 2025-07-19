import React, { useState, useEffect } from 'react';
import { Store, Package, TrendingUp, DollarSign, Edit, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface InventoryItem {
  product_id: string;
  current_stock: number;
  product: {
    product_name: string;
    price: number;
    category: string;
    subcategory: string;
  };
}

const Vendor = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          product_id,
          current_stock,
          products(
            product_name,
            price,
            category,
            subcategory
          )
        `)
        .eq('store_id', 'store-1'); // Default store

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        product_id: item.product_id,
        current_stock: item.current_stock,
        product: item.products
      }));
      
      setInventory(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId: string, stock: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: stock,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('store_id', 'store-1');

      if (error) throw error;

      setInventory(prev => 
        prev.map(item => 
          item.product_id === productId 
            ? { ...item, current_stock: stock }
            : item
        )
      );
      
      setEditingId(null);
      setNewStock('');
      
      toast({
        title: "Stock updated",
        description: "Inventory has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update stock: " + error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInventory();

    // Set up real-time subscription for inventory updates
    const channel = supabase
      .channel('inventory-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Please sign in</h3>
            <p className="text-muted-foreground mb-6">
              Sign in to access the vendor dashboard
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

  const totalRevenue = inventory.reduce((sum, item) => sum + (item.product.price * item.current_stock), 0);
  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter(item => item.current_stock < 10).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your inventory and track performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-success">{totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-secondary">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">Product</th>
                    <th className="text-left py-3 px-2 font-semibold">Price</th>
                    <th className="text-left py-3 px-2 font-semibold">Stock</th>
                    <th className="text-left py-3 px-2 font-semibold">Category</th>
                    <th className="text-left py-3 px-2 font-semibold">Aisle</th>
                    <th className="text-left py-3 px-2 font-semibold">Sales</th>
                    <th className="text-left py-3 px-2 font-semibold">Revenue</th>
                    <th className="text-left py-3 px-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.product_id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-2">
                          <div>
                            <p className="font-medium">{item.product.product_name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-semibold">${item.product.price}</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            {editingId === item.product_id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={newStock}
                                  onChange={(e) => setNewStock(e.target.value)}
                                  className="w-20"
                                  placeholder={item.current_stock.toString()}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleStockUpdate(item.product_id, parseInt(newStock) || item.current_stock)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(null);
                                    setNewStock('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className={item.current_stock < 10 ? 'text-warning font-bold' : ''}>
                                  {item.current_stock}
                                </span>
                                {item.current_stock < 10 && (
                                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                                    Low
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="outline">{item.product.category}</Badge>
                        </td>
                        <td className="py-4 px-2 text-muted-foreground">
                          {item.product.subcategory}
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-medium">0</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-semibold text-success">
                            $0
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          {editingId !== item.product_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(item.product_id);
                                setNewStock(item.current_stock.toString());
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Stock
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Vendor;