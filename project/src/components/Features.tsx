import React from 'react';
import { Music, Headphones, Download, Heart } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Music className="w-12 h-12 text-purple-400" />,
      title: 'Play millions of songs',
      description: 'Listen to the songs you love, and discover new music and podcasts.',
    },
    {
      icon: <Headphones className="w-12 h-12 text-purple-400" />,
      title: 'Ad-free music listening',
      description: 'Enjoy uninterrupted music with BlockMusic Premium.',
    },
    {
      icon: <Download className="w-12 h-12 text-purple-400" />,
      title: 'Download music',
      description: 'Listen anywhere, even offline. Download your favorite songs.',
    },
    {
      icon: <Heart className="w-12 h-12 text-purple-400" />,
      title: 'Create playlists',
      description: 'Make playlists with your favorite songs and share them with friends.',
    },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why go Premium?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get the most out of BlockMusic with Premium features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-black/50 p-8 rounded-xl border border-gray-800 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;