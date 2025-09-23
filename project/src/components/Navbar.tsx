import { Link } from 'react-router-dom';
import { WalletButton } from './WalletButton';

export function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-2xl font-bold text-purple-400">
            BlockMusic
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-purple-300 transition-colors">
              Home
            </Link>
            <Link to="/marketplace" className="hover:text-purple-300 transition-colors">
              Marketplace
            </Link>
            <Link to="/create" className="hover:text-purple-300 transition-colors">
              Create
            </Link>
            <Link to="/profile" className="hover:text-purple-300 transition-colors">
              Profile
            </Link>
          </div>
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}
