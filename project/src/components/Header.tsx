import React, { useState } from 'react';
import { Play, Menu, X } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, onSignupClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Premium', href: '#premium' },
    { name: 'Support', href: '#support' },
    { name: 'Download', href: '#download' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-white text-xl font-bold">BlockMusic</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white hover:text-purple-400 transition-colors duration-200 font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onLoginClick}
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Log in
            </button>
            <button
              onClick={onSignupClick}
              className="bg-white text-black px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform duration-200"
            >
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-purple-400 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-white hover:text-purple-400 transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    onSignupClick();
                    setIsMenuOpen(false);
                  }}
                  className="mx-3 bg-white text-black px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform duration-200"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;