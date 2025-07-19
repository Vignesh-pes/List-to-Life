-- Fix column types to work with Supabase auth (UUID)
-- First, drop the old custom users table since we're using Supabase auth
DROP TABLE IF EXISTS public.users CASCADE;

-- Alter existing tables to use UUID for user_id
ALTER TABLE public.wishlists ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.carts ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.reviews ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Now create the proper foreign key constraints
ALTER TABLE public.wishlists ADD CONSTRAINT wishlists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.carts ADD CONSTRAINT carts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table that references Supabase auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer',
  loyalty_points INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Products (readable by everyone)
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Vendors can update products" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'vendor'
    )
  );

-- Inventory (readable by everyone, updatable by vendors)
CREATE POLICY "Inventory is viewable by everyone" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "Vendors can update inventory" ON public.inventory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'vendor'
    )
  );

-- Substitutions (readable by everyone)
CREATE POLICY "Substitutions are viewable by everyone" ON public.substitutions
  FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Wishlists (users can only see their own)
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Carts (users can only see their own)
CREATE POLICY "Users can manage their own carts" ON public.carts
  FOR ALL USING (auth.uid() = user_id);

-- Reviews (everyone can read, users can create their own)
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders (users can only see their own)
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items (users can only see their own through orders)
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.order_id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.order_id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, loyalty_points, preferences)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name', 
    NEW.email,
    'customer',
    0,
    '{}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for inventory updates
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;

-- Insert sample products
INSERT INTO public.products (product_id, product_name, brand, category, subcategory, price, image_url, description, attributes) VALUES
('prod_001', 'Samsung 55" 4K Smart TV', 'Samsung', 'Electronics', 'TVs', 499.99, 'https://images.unsplash.com/photo-1593305841991-05678b7b7b8e?w=400', 'Crystal UHD display with HDR and smart features', '{"screen_size": "55 inch", "resolution": "4K", "smart": true}'),
('prod_002', 'Apple AirPods Pro', 'Apple', 'Electronics', 'Audio', 199.99, 'https://images.unsplash.com/photo-1600294037681-c80b4c5c01d7?w=400', 'Wireless earbuds with active noise cancellation', '{"wireless": true, "noise_cancellation": true}'),
('prod_003', 'Men''s Denim Jacket', 'Levi''s', 'Clothing', 'Outerwear', 39.99, 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400', 'Classic blue denim jacket with medium fit', '{"material": "denim", "fit": "medium", "color": "blue"}'),
('prod_004', 'Organic Whole Milk', 'Horizon', 'Groceries', 'Dairy', 4.99, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', '1-gallon jug of fresh organic milk', '{"organic": true, "size": "1 gallon"}'),
('prod_005', 'HP Pavilion Laptop', 'HP', 'Electronics', 'Computers', 799.99, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', '16GB RAM, 512GB SSD, Intel i5 processor', '{"ram": "16GB", "storage": "512GB SSD", "processor": "Intel i5"}'),
('prod_006', 'Women''s Athletic Leggings', 'Nike', 'Clothing', 'Activewear', 24.99, 'https://images.unsplash.com/photo-1506629905877-126d3ed3981b?w=400', 'High-waisted, moisture-wicking leggings', '{"material": "polyester blend", "fit": "high-waisted"}'),
('prod_007', 'Ground Turkey', 'Butterball', 'Groceries', 'Meat', 5.99, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', 'Lean ground turkey, 1lb package', '{"weight": "1 lb", "protein": "93% lean"}'),
('prod_008', 'Taco Shells', 'Old El Paso', 'Groceries', 'Mexican Food', 2.49, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 'Hard taco shells, 12 count', '{"count": 12, "type": "hard shell"}'),
('prod_009', 'Salsa', 'Pace', 'Groceries', 'Mexican Food', 3.29, 'https://images.unsplash.com/photo-1582169296855-fc9d380c8157?w=400', 'Medium salsa, 16 oz jar', '{"size": "16 oz", "spice_level": "medium"}'),
('prod_010', 'Water Filter', 'Brita', 'Home', 'Kitchen', 12.99, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400', 'Replacement filter for water pitcher', '{"type": "replacement", "compatibility": "Brita pitchers"}')
ON CONFLICT (product_id) DO NOTHING;

-- Insert sample inventory
INSERT INTO public.inventory (store_id, product_id, current_stock, last_updated, daily_sales_rate) VALUES
('store_001', 'prod_001', 15, CURRENT_TIMESTAMP, 2),
('store_001', 'prod_002', 30, CURRENT_TIMESTAMP, 5),
('store_001', 'prod_003', 50, CURRENT_TIMESTAMP, 3),
('store_001', 'prod_004', 200, CURRENT_TIMESTAMP, 25),
('store_001', 'prod_005', 8, CURRENT_TIMESTAMP, 1),
('store_001', 'prod_006', 75, CURRENT_TIMESTAMP, 8),
('store_001', 'prod_007', 40, CURRENT_TIMESTAMP, 12),
('store_001', 'prod_008', 60, CURRENT_TIMESTAMP, 10),
('store_001', 'prod_009', 50, CURRENT_TIMESTAMP, 8),
('store_001', 'prod_010', 25, CURRENT_TIMESTAMP, 3)
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Insert sample substitutions
INSERT INTO public.substitutions (original_product_id, substitute_product_id, substitution_score, reason, type) VALUES
('prod_007', 'prod_004', 0.3, 'Both are protein sources', 'cross_category'),
('prod_008', 'prod_009', 0.8, 'Both are Mexican food items', 'complementary'),
('prod_002', 'prod_005', 0.2, 'Both are electronics', 'category_match')
ON CONFLICT (original_product_id, substitute_product_id) DO NOTHING;