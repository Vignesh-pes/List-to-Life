import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import CategoryFilters from '../components/CategoryFilters';
import FeaturedProducts from '../components/FeaturedProducts';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategoryFilters />
        <FeaturedProducts />
      </main>
    </div>
  );
};

export default Index;
