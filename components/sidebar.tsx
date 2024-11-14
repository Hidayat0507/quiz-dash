"use client";

import Link from 'next/link';
import { LayoutDashboard, User, Settings, Brain, Upload } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/quiz', icon: Brain, label: 'Quiz' },
    { href: '/quiz/upload', icon: Upload, label: 'Upload Quiz' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`bg-white shadow-lg ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className={`text-2xl font-bold text-blue-600 ${!isOpen && 'hidden'}`}>
            Dashboard
          </h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors ${
                      pathname === item.href ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={`ml-3 ${!isOpen && 'hidden'}`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}