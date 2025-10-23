'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dog, Plus, Home } from 'lucide-react';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const LOGO_SIZE = 'w-8 h-8';

// Navigation item interface
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Navigation items configuration
const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <Home className={SMALL_ICON_SIZE} />
  },
  {
    href: '/dogs/new',
    label: 'Add Dog',
    icon: <Plus className={SMALL_ICON_SIZE} />
  }
];

// Logo component
const Logo: React.FC = () => (
  <Link href="/" className="flex items-center space-x-3">
    <div className={`${LOGO_SIZE} bg-green-500 rounded-full flex items-center justify-center`}>
      <Dog className={`${ICON_SIZE} text-black`} />
    </div>
    <span className="text-xl font-bold text-white">PedigreeBuilder</span>
  </Link>
);

// Navigation link component
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive }) => (
  <Link
    href={item.href}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-gray-800 text-white' 
        : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`}
  >
    {item.icon}
    <span>{item.label}</span>
  </Link>
);

// Header component
const Header: React.FC<{ pathname: string }> = ({ pathname }) => {
  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-gray-900 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          
          <nav className="flex space-x-2">
            {NAV_ITEMS.map((item) => (
              <NavLink 
                key={item.href} 
                item={item} 
                isActive={isActive(item.href)} 
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

// Footer component
const Footer: React.FC = () => (
  <footer className="bg-gray-900 border-t border-gray-800 mt-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <div className="text-center text-gray-400">
        <p>&copy; 2024 PedigreeBuilder. Built for dog lovers.</p>
      </div>
    </div>
  </footer>
);

// Main layout component
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-900">
      <Header pathname={pathname} />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;