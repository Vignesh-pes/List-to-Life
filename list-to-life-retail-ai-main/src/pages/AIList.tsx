import React from 'react';
import Header from '../components/Header';
import AIListGenerator from '../components/AIListGenerator';

const AIList = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <AIListGenerator />
      </main>
    </div>
  );
};

export default AIList;