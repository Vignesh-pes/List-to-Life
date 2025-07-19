import React from 'react';
import { Sparkles, Brain, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-hero py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Shopping Assistant
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your <span className="text-primary">Proactive</span> Shopping
            <br />
            Assistant is Here
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of shopping with our AI assistant that anticipates your needs, 
            generates personalized lists, and optimizes your entire shopping journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/ai-list">
              <Button variant="hero" size="lg" className="group">
                <Brain className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                Try AI List Generation
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>

          {/* AI Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Smart List Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us your plans and get an intelligent shopping list with real-time inventory
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Proactive Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations based on seasons, trends, and your preferences
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Omni-Channel Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Seamless shopping across online and in-store with optimized routes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;