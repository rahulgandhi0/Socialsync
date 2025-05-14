import React from 'react';
import GlowButton from '../components/GlowButton';
import GlowingCard from '../components/GlowingCard';

const GlowDemo = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Glow Components Demo</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Gradient Headers</h2>
        <div className="bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow p-6 rounded-lg shadow-lg mb-4">
          <h3 className="text-xl font-bold text-white">Animated Gradient Header</h3>
          <p className="text-white text-opacity-90">This header uses the glow-flow animation</p>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Glow Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <GlowButton>Default Button</GlowButton>
          <GlowButton className="py-3 px-8 text-lg">Large Button</GlowButton>
          <GlowButton className="py-1 px-4 text-sm">Small Button</GlowButton>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Glowing Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlowingCard 
            title="Hover Me" 
            description="This card has a glowing effect on hover."
          >
            <p className="text-sm text-gray-500">Move your mouse over this card to see the effect</p>
          </GlowingCard>
          
          <GlowingCard 
            title="Interactive Card" 
            description="Cards can contain interactive elements too."
          >
            <div className="mt-4">
              <GlowButton className="w-full">Click Me</GlowButton>
            </div>
          </GlowingCard>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Custom Gradient Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className="h-40 rounded-lg flex items-center justify-center bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow"
            >
              <span className="text-white font-bold text-xl">Gradient Box {i}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GlowDemo; 