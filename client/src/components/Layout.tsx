'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Plus, GitBranch } from 'lucide-react';

// Constants
const SMALL_ICON_SIZE = 'h-4 w-4';

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
    label: 'Database',
    icon: <Database className={SMALL_ICON_SIZE} />
  },
  {
    href: '/breeding-simulator',
    label: 'Breeding Simulator',
    icon: <GitBranch className={SMALL_ICON_SIZE} />
  },
  {
    href: '/dogs/new',
    label: 'Add Dog',
    icon: <Plus className={SMALL_ICON_SIZE} />
  }
];

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
        : 'text-gray-300 hover:text-[#3ecf8e] hover:bg-gray-800'
    }`}
  >
    {item.icon}
    <span>{item.label}</span>
  </Link>
);

// Header component
const Header: React.FC<{ pathname: string }> = ({ pathname }) => {
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-600 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center h-16">
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
    </div>
  );
};

export default Layout;