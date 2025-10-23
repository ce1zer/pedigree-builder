'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dog, Plus, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Dog className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">PedigreeBuilder</span>
            </Link>

            {/* Navigation */}
            <nav className="flex space-x-2">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                href="/dogs/new"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/dogs/new') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Dog</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 PedigreeBuilder. Built for dog lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
