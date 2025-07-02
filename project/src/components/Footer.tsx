import React from 'react';
import { Play, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Company',
      links: ['About', 'Jobs', 'For the Record'],
    },
    {
      title: 'Communities',
      links: ['For Artists', 'Developers', 'Advertising', 'Investors', 'Vendors'],
    },
    {
      title: 'Useful links',
      links: ['Support', 'Web Player', 'Free Mobile App'],
    },
  ];

  const socialLinks = [
    { icon: <Instagram className="w-6 h-6" />, href: '#' },
    { icon: <Twitter className="w-6 h-6" />, href: '#' },
    { icon: <Facebook className="w-6 h-6" />, href: '#' },
  ];

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Social */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-white text-xl font-bold">BlockMusic</span>
            </div>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="col-span-1">
              <h3 className="text-white font-bold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Legal
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Privacy Center
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Cookies
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                About Ads
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 BlockMusic AB
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;