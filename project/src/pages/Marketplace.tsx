import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Marketplace() {
  const location = useLocation();
  
  // Show welcome message if redirected from subscription
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      toast.success(state.message, {
        autoClose: 5000,
      });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Music Marketplace</h1>
        <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/50 rounded-lg px-4 py-2">
          <span className="text-purple-400 text-sm font-semibold">🎯 Explorer Access Active</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div className="aspect-square bg-gray-700 rounded mb-4"></div>
            <h3 className="font-semibold">Song Title {item}</h3>
            <p className="text-gray-400 text-sm">Artist Name</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-purple-400">0.05 ETH</span>
              <button className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
