import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { WalletButton } from './WalletButton';

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return (window.localStorage.getItem('blockmusic_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_theme', nextTheme);
    }
  }, [theme]);

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center gap-3">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-2xl font-bold text-purple-400">
            BlockMusic
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/home" className="hover:text-purple-300 transition-colors">
              Home
            </Link>
            <Link to="/marketplace" className="hover:text-purple-300 transition-colors">
              Explore
            </Link>
            <Link to="/playlists" className="hover:text-purple-300 transition-colors">
              Playlists
            </Link>
            <Link to="/upload" className="hover:text-purple-300 transition-colors">
              Upload
            </Link>
            <Link to="/artist" className="hover:text-purple-300 transition-colors">
              Artist Dashboard
            </Link>
            <Link to="/profile" className="hover:text-purple-300 transition-colors">
              Profile
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white hover:border-purple-500 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
