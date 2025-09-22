import React from 'react';
import { FaHome, FaSearch, FaPlus, FaHeart } from 'react-icons/fa';
import { BiLibrary } from 'react-icons/bi';
import { BsThreeDots } from 'react-icons/bs';
import { useBlockchain } from '../hooks/useBlockchain';

const Sidebar = () => (
  <div className="w-64 bg-black text-gray-300 p-6 flex flex-col h-full">
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white mb-6">BlockMusic</h1>
      <nav>
        <ul className="space-y-4">
          <li className="flex items-center space-x-4 hover:text-white cursor-pointer">
            <FaHome className="text-xl" />
            <span>Home</span>
          </li>
          <li className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer">
            <FaSearch className="text-xl" />
            <span>Search</span>
          </li>
          <li className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer">
            <BiLibrary className="text-xl" />
            <span>Your Library</span>
          </li>
          <li className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer">
              <div className="bg-gray-400 p-1 rounded">
                <FaPlus className="text-black" />
              </div>
              <span>Create Playlist</span>
            </div>
            <div className="flex items-center space-x-2 mt-4 text-gray-400 hover:text-white cursor-pointer">
              <div className="bg-gradient-to-br from-purple-500 to-blue-300 p-1 rounded">
                <FaHeart className="text-white" />
              </div>
              <span>Liked Songs</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>
);

const PlaylistCard = ({ title, description, imageUrl }: { title: string; description: string; imageUrl: string }) => (
  <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group">
    <div className="relative">
      <img src={imageUrl} alt={title} className="w-full aspect-square object-cover rounded mb-4 shadow-lg" />
      <button 
        aria-label="Play" 
        title="Play"
        className="absolute bottom-6 right-2 bg-green-500 text-black rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg transform translate-y-2 group-hover:translate-y-0"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      </button>
    </div>
    <h3 className="text-white font-semibold mb-1 truncate">{title}</h3>
    <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
  </div>
);

export const Home = () => {
  const { isConnected } = useBlockchain();
  
  // Mock data for playlists
  const playlists = [
    {
      id: 1,
      title: 'Today\'s Top Hits',
      description: 'The hottest tracks right now',
      imageUrl: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6'
    },
    {
      id: 2,
      title: 'RapCaviar',
      description: 'New music from DaBaby, Polo G and more',
      imageUrl: 'https://i.scdn.co/image/ab67706f000000025f73260d83eb3270a72ceb1a'
    },
    {
      id: 3,
      title: 'All Out 2010s',
      description: 'The biggest songs of the 2010s',
      imageUrl: 'https://i.scdn.co/image/ab67706f00000002d72ef75a14ca6f060c01d7d9'
    },
    {
      id: 4,
      title: 'Rock Classics',
      description: 'Rock legends & epic songs',
      imageUrl: 'https://i.scdn.co/image/ab67706f00000002d0d3fcdcb8501404eb9e3b1f'
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl font-bold mb-6">Welcome to BlockMusic</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-lg">Connect your wallet to start listening to your favorite music on the blockchain</p>
            <button className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transform transition-transform">
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Good afternoon</h2>
              <div className="flex space-x-4">
                <button 
                  aria-label="More options" 
                  title="More options"
                  className="text-gray-400 hover:text-white"
                >
                  <BsThreeDots className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  title={playlist.title}
                  description={playlist.description}
                  imageUrl={playlist.imageUrl}
                />
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Made For You</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...playlists].reverse().map((playlist) => (
                <PlaylistCard
                  key={`made-for-you-${playlist.id}`}
                  title={`${playlist.title} Mix`}
                  description={`Made for you based on your listening history`}
                  imageUrl={playlist.imageUrl}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
