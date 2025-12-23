// components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  UserOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
  CloseOutlined,
  BellOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Dropdown,
  Button,
  Typography,
  Divider,
  Switch,
  Menu,
  Drawer,
  Badge,
  Space
} from 'antd';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

const { Text } = Typography;

interface User {
  email?: string;
  name?: string;
  avatar?: string;
}

interface HeaderProps {
  user: User;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  // Check for dark mode in localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Sign out dari Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // 2. Panggil callback onLogout jika ada (untuk update state di parent component)
      if (onLogout) {
        onLogout()
      }

      // 3. Close mobile menu jika terbuka
      setMobileMenuOpen(false)

      // 4. Redirect ke halaman login/home
      router.push('/login') // atau '/auth/login' sesuai routing Anda

      // 5. Optional: Clear localStorage/sessionStorage terkait auth
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')

    } catch (error) {
      console.error('Error logging out:', error)
      router.push('/login')
    }
  }
  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        router.push('/profile');
        setMobileMenuOpen(false);
      }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];
  const mobileMenu = (
    <div className="py-4">
      <div className="flex items-center px-4 mb-6">
        <Avatar
          size="large"
          className="bg-blue-500"
          src={user?.avatar}
        >
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </Avatar>
        <div className="ml-3">
          <Text strong className="block text-gray-900 dark:text-white">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text type="secondary" className="text-xs">{user?.email || ''}</Text>
        </div>
      </div>
      <Divider className="my-2 dark:border-gray-700" />
      <Menu
        mode="vertical"
        items={menuItems}
        className="border-none bg-transparent"
      />
    </div>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Clickable */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center focus:outline-none"
            >
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Job Matcher
              </h1>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            {/* <Button
              type="text"
              icon={darkMode ? <SunOutlined className="text-yellow-500" /> : <MoonOutlined />}
              onClick={() => toggleDarkMode(!darkMode)}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              shape="circle"
            /> */}

            {/* Notifications */}
            {/* <Badge count={3} size="small" dot>
              <Button
                type="text"
                icon={<BellOutlined />}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                shape="circle"
                onClick={() => router.push('/notifications')}
              />
            </Badge> */}

            {/* User Dropdown - Alternatif dengan div */}
            {/* User Dropdown */}
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click', 'hover']}
              placement="bottomRight"
            >
              <div className="flex items-center cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <Avatar
                  size="default"
                  className="bg-blue-500"
                  src={user?.avatar}
                >
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </Avatar>
                <div className="ml-3 hidden lg:block text-left">
                  <Text className="text-sm font-medium text-white dark:text-white block">
                    {user?.name || 'User'}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {user?.email || ''}
                  </Text>
                </div>
                <DownOutlined className="ml-1 text-gray-400 text-xs hidden lg:block" />
              </div>
            </Dropdown>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Dark Mode Toggle - Mobile */}
            <Button
              type="text"
              icon={darkMode ? <SunOutlined className="text-yellow-500" /> : <MoonOutlined />}
              onClick={() => toggleDarkMode(!darkMode)}
              className="text-gray-600 dark:text-gray-300"
              shape="circle"
            />

            {/* Notifications - Mobile */}
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="text-gray-600 dark:text-gray-300"
                shape="circle"
                onClick={() => router.push('/notifications')}
              />
            </Badge>

            <Button
              type="text"
              icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300"
              shape="circle"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <Avatar
              size="small"
              className="bg-blue-500 mr-2"
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <span className="text-gray-900 dark:text-white">Menu</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        closable={false}
        styles={{
          header: {
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            background: darkMode ? '#1f2937' : '#ffffff',
          },
          body: {
            padding: 0,
            background: darkMode ? '#1f2937' : '#ffffff',
          }
        }}
      >
        {mobileMenu}
      </Drawer>
    </header>
  );
}