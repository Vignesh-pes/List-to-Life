import React from 'react';
import { Laptop, Shirt, ShoppingBasket, Home, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: Laptop,
    count: 156,
    color: 'text-primary'
  },
  {
    id: 'clothing',
    name: 'Clothing',
    icon: Shirt,
    count: 243,
    color: 'text-secondary'
  },
  {
    id: 'groceries',
    name: 'Groceries',
    icon: ShoppingBasket,
    count: 389,
    color: 'text-success'
  },
  {
    id: 'home',
    name: 'Home & Garden',
    icon: Home,
    count: 178,
    color: 'text-warning'
  }
];

const CategoryFilters = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Shop by Category
          </h2>
          <p className="text-muted-foreground">
            Find what you need in our organized departments
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-primary/10 hover:border-primary/30"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-background shadow-md flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {category.count} items
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Suggestions */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm">
              Back-to-school checklist
            </Button>
            <Button variant="outline" size="sm">
              Weekend BBQ party
            </Button>
            <Button variant="outline" size="sm">
              Healthy meal prep
            </Button>
            <Button variant="outline" size="sm">
              Home office setup
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryFilters;