import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useI18n } from '@/src/lib/i18n';
import { useTheme } from '@/src/lib/theme';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  onClick?: () => void;
  key?: string;
}

const SidebarItem = ({ icon: Icon, label, to, onClick }: SidebarItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group",
      isActive
        ? "bg-primary text-white shadow-md shadow-primary/20"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t, lang, setLang } = useI18n();
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: 'cafes', label: t('nav.cafes'), icon: LayoutDashboard, to: '/cafes' },
    { id: 'categories', label: t('nav.categories') || (lang === 'kz' ? 'Категориялар' : 'Категории'), icon: Menu, to: '/categories' },
    { id: 'subscriptions', label: t('nav.subscriptions'), icon: CreditCard, to: '/subscriptions' },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, to: '/analytics' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, to: '/settings' },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={lang}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
      >
        {/* Sidebar Desktop */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 lg:block z-50 transition-colors duration-300">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold text-xl">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CafeAdmin</span>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                />
              ))}
            </nav>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 group">
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 transition-transform duration-300 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold text-xl">
                  C
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CafeAdmin</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-4 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden md:flex items-center flex-1 max-w-md ml-4">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={t('action.search')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-xl text-sm transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setLang('kz')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    lang === 'kz' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  ҚАЗ
                </button>
                <button
                  onClick={() => setLang('ru')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    lang === 'ru' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  РУС
                </button>
              </div>

              <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-slate-800" />

              <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </button>
              <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Lunar Tech.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('nav.admin')}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 lg:p-10">
            {children}
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
