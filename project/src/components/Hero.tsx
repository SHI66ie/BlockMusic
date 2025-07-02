import React from 'react';
import { Play } from 'lucide-react';

interface HeroProps {
  onSignupClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSignupClick }) => {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black flex items-center">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Listening is
            <span className="text-purple-400"> everything</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Millions of songs and podcasts. No credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onSignupClick}
              className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-4 rounded-full text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              GET BLOCKMUSIC FREE
            </button>
            <button className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors duration-200">
              <Play className="w-5 h-5" />
              <span className="text-lg font-medium">Play Demo</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Floating Music Cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg transform rotate-12 opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg transform -rotate-12 opacity-20 animate-pulse delay-300"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg transform rotate-45 opacity-20 animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-10 w-20 h-20 bg-gradient-to-br from-purple-300 to-purple-500 rounded-lg transform -rotate-45 opacity-20 animate-pulse delay-1000"></div>
      </div>
    </section>
  );
};

export default Hero;