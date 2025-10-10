import React from 'react';
import { FaMusic } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

const FeaturedCard = ({ title, description, imageUrl, category }: { title: string; description: string; imageUrl: string; category: string }) => (
  <div className="relative group bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
    <div className="aspect-square bg-gray-700 relative overflow-hidden">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
        <button 
          aria-label={`Play ${title}`}
          className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center hover:scale-105 transform transition-transform"
        >
          <FaMusic className="text-white text-xl" />
        </button>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
      <div className="mt-2">
        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
          {category}
        </span>
      </div>
    </div>
  </div>
);

const TrackItem = ({ title, artist, duration, isPlaying = false }: { title: string; artist: string; duration: string; isPlaying?: boolean }) => (
  <div className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors group">
    <div className="w-10 h-10 rounded bg-gray-700 mr-4 flex-shrink-0 overflow-hidden">
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <FaMusic />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className={`text-sm font-medium truncate ${isPlaying ? 'text-purple-400' : 'text-white'}`}>
        {title}
      </h4>
      <p className="text-xs text-gray-400 truncate">{artist}</p>
    </div>
    <div className="ml-4 text-sm text-gray-400">
      {duration}
    </div>
    <button 
      aria-label={`More options for ${title}`}
      className="ml-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    </button>
  </div>
);

export const Home = () => {
  const { isConnected } = useAccount();

  const featuredItems = [
    {
      title: "Summer Vibes",
      description: "The hottest tracks of the season",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "Trending"
    },
    {
      title: "Chill Beats",
      description: "Relaxing beats to focus",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "Focus"
    },
    {
      title: "Workout Mix",
      description: "High energy tracks to keep you moving",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "Energy"
    }
  ];

  const recentTracks = [
    { id: 1, title: "Midnight City", artist: "M83", duration: "4:03", isPlaying: true },
    { id: 2, title: "Blinding Lights", artist: "The Weeknd", duration: "3:20" },
    { id: 3, title: "Levitating", artist: "Dua Lipa", duration: "3:23" },
    { id: 4, title: "Save Your Tears", artist: "The Weeknd", duration: "3:35" },
    { id: 5, title: "Stay", artist: "The Kid LAROI, Justin Bieber", duration: "2:21" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Stream Music, Support Artists Directly</h1>
          <p className="text-lg text-gray-200 mb-8">
            BlockMusic is a decentralized music streaming platform where artists earn 85% from every play. 
            Subscribe once, stream unlimited music, and support creators with every listen.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/marketplace" 
              className="bg-white text-purple-900 hover:bg-gray-100 px-6 py-3 rounded-full font-medium transition-colors"
            >
              Explore
            </Link>
            {isConnected && (
              <Link 
                to="/upload" 
                className="border-2 border-white text-white hover:bg-white hover:bg-opacity-10 px-6 py-3 rounded-full font-medium transition-colors"
              >
                Upload Music
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Tracks</h2>
          <Link to="/marketplace" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item, index) => (
            <FeaturedCard 
              key={index}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
              category={item.category}
            />
          ))}
        </div>
      </section>

      {/* Recently Played */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recently Played</h2>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            See more
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-2">
          {recentTracks.map((track) => (
            <TrackItem 
              key={track.id}
              title={track.title}
              artist={track.artist}
              duration={track.duration}
              isPlaying={track.isPlaying}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Pop', color: 'bg-pink-500' },
            { name: 'Hip Hop', color: 'bg-purple-500' },
            { name: 'Electronic', color: 'bg-blue-500' },
            { name: 'Rock', color: 'bg-red-500' },
            { name: 'Jazz', color: 'bg-yellow-500' },
            { name: 'Classical', color: 'bg-green-500' },
          ].map((category, index) => (
            <div 
              key={index}
              className={`${category.color} rounded-lg p-6 hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <p className="text-sm opacity-80 mt-1">100+ tracks</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">10,000+</div>
          <div className="text-gray-400">Tracks available</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">5,000+</div>
          <div className="text-gray-400">Artists</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold mb-2">1M+</div>
          <div className="text-gray-400">Monthly listeners</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
