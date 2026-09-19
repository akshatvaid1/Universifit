import React, { useState } from 'react';
import {
  Menu,
  X,
  Zap,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui';
import { NotificationBell } from './NotificationBell';
import type { AuthUserData } from '../services/api';

interface HeaderProps {
  currentUser?: AuthUserData | null;
  onLogout?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateMySpace?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateAdmin?: () => void;
  onOpenMessages?: () => void;
  onOpenSupport?: (category?: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER', refId?: string) => void;
  onNavigate?: (route: string) => void;
  onSearchSubmit?: (query: string) => void;
  onSelectCreator?: (creatorId: string) => void;
  onSelectCourse?: (courseId: string) => void;
  unreadMessagesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenAuth,
  onNavigateMySpace,
  onNavigateDashboard,
  onNavigateAdmin,
  onOpenMessages,
  onOpenSupport,
  onNavigate,
  unreadMessagesCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string, fallbackRoute?: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (fallbackRoute && onNavigate) {
      onNavigate(fallbackRoute);
    } else {
      window.location.hash = `#${sectionId}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E8E6] text-[#14161A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-md bg-[#14161A] text-white font-sans font-bold text-base flex items-center justify-center tracking-tight">
              U
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-[#14161A] leading-none">
              Universifit
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('explore-goals', 'discover')}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors cursor-pointer"
            >
              Explore by Goal
            </button>

            <button
              onClick={() => {
                if (currentUser?.role === 'CREATOR' && onNavigateDashboard) {
                  onNavigateDashboard();
                } else if (onNavigate) {
                  onNavigate('dashboard');
                } else {
                  onOpenAuth('register');
                }
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors cursor-pointer"
            >
              For Creators
            </button>

            <button
              onClick={() => handleNavClick('community', 'community')}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors cursor-pointer"
            >
              Community
            </button>

            <button
              onClick={() => handleNavClick('pricing', 'discover')}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Right Side: Auth Actions / User Controls */}
        <div className="hidden sm:flex items-center gap-2.5">
          {!currentUser ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenAuth('register')}
              >
                Join
              </Button>
            </>
          ) : (
            <>
              {/* My Space (for Buyer & Creator) */}
              {onNavigateMySpace && (currentUser.role === 'BUYER' || currentUser.role === 'CREATOR') && (
                <button
                  onClick={onNavigateMySpace}
                  className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-xs font-medium text-[#14161A] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#3652C4]" />
                  <span>My Space</span>
                </button>
              )}

              {/* Creator Studio (for Creator) */}
              {onNavigateDashboard && currentUser.role === 'CREATOR' && (
                <button
                  onClick={onNavigateDashboard}
                  className="px-3 py-1.5 rounded-md bg-[#3652C4] hover:bg-[#2D44A6] text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Creator Studio</span>
                </button>
              )}

              {/* Admin Audit (for Admin) */}
              {onNavigateAdmin && currentUser.role === 'ADMIN' && (
                <button
                  onClick={onNavigateAdmin}
                  className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-xs font-medium text-[#14161A] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3652C4]" />
                  <span>Admin Audit</span>
                </button>
              )}

              {/* Direct Messages */}
              {onOpenMessages && (
                <button
                  onClick={onOpenMessages}
                  className="relative p-2 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] transition-colors cursor-pointer flex items-center justify-center"
                  title="Direct Messages"
                >
                  <MessageSquare className="w-4 h-4 text-[#14161A]" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3652C4] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
              )}

              {/* Support Desk */}
              {onOpenSupport && (
                <button
                  onClick={() => onOpenSupport()}
                  className="p-2 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] transition-colors cursor-pointer flex items-center justify-center"
                  title="Help & Support Desk"
                >
                  <HelpCircle className="w-4 h-4 text-[#8B8D91]" />
                </button>
              )}

              {/* In-App Notification Bell */}
              <NotificationBell onNavigate={onNavigate} />

              {/* User Avatar Badge & Sign Out */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#E8E8E6]">
                <div
                  className="flex items-center gap-1.5 text-xs text-[#14161A] max-w-[140px] truncate"
                  title={currentUser.email}
                >
                  <div className="w-6 h-6 rounded-md bg-[#14161A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {currentUser.profile?.fullName
                      ? currentUser.profile.fullName[0].toUpperCase()
                      : currentUser.email[0].toUpperCase()}
                  </div>
                  <span className="truncate font-medium text-[#14161A]">
                    {currentUser.profile?.fullName || currentUser.email.split('@')[0]}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-md hover:bg-black/[0.04] text-[#8B8D91] hover:text-[#14161A] transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && <NotificationBell onNavigate={onNavigate} />}

          {!currentUser ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAuth('login')}
            >
              Sign In
            </Button>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white text-xs font-bold flex items-center justify-center">
              {currentUser.profile?.fullName
                ? currentUser.profile.fullName[0].toUpperCase()
                : currentUser.email[0].toUpperCase()}
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-black/[0.05]"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[#E8E8E6] px-4 py-6 space-y-4"
          >
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('explore-goals', 'discover')}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors"
              >
                Explore by Goal
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (currentUser?.role === 'CREATOR' && onNavigateDashboard) {
                    onNavigateDashboard();
                  } else if (onNavigate) {
                    onNavigate('dashboard');
                  } else {
                    onOpenAuth('register');
                  }
                }}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors"
              >
                For Creators
              </button>

              <button
                onClick={() => handleNavClick('community', 'community')}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors"
              >
                Community
              </button>

              <button
                onClick={() => handleNavClick('pricing', 'discover')}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-medium text-[#14161A] hover:text-[#3652C4] hover:bg-black/[0.03] transition-colors"
              >
                Pricing
              </button>
            </div>

            {!currentUser ? (
              <div className="pt-4 border-t border-[#E8E8E6] flex flex-col gap-2.5">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                >
                  Join
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-[#E8E8E6] space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E8E6]">
                  <div className="w-8 h-8 rounded-md bg-[#14161A] text-white text-xs font-bold flex items-center justify-center">
                    {currentUser.profile?.fullName
                      ? currentUser.profile.fullName[0].toUpperCase()
                      : currentUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#14161A] truncate max-w-[180px]">
                      {currentUser.profile?.fullName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-[#8B8D91] font-mono uppercase font-semibold">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {onNavigateMySpace && (currentUser.role === 'BUYER' || currentUser.role === 'CREATOR') && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateMySpace();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-black/[0.03] text-left text-sm font-medium text-[#14161A]"
                    >
                      <Zap className="w-4 h-4 text-[#3652C4]" />
                      <span>My Space</span>
                    </button>
                  )}

                  {onNavigateDashboard && currentUser.role === 'CREATOR' && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateDashboard();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-black/[0.03] text-left text-sm font-medium text-[#14161A]"
                    >
                      <Sparkles className="w-4 h-4 text-[#3652C4]" />
                      <span>Creator Studio</span>
                    </button>
                  )}

                  {onNavigateAdmin && currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateAdmin();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-black/[0.03] text-left text-sm font-medium text-[#14161A]"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#3652C4]" />
                      <span>Admin Audit</span>
                    </button>
                  )}

                  {onOpenMessages && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenMessages();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-black/[0.03] text-left text-sm font-medium text-[#14161A]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#14161A]" />
                      <span>Direct Messages</span>
                    </button>
                  )}

                  {onOpenSupport && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenSupport();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-black/[0.03] text-left text-sm font-medium text-[#14161A]"
                    >
                      <HelpCircle className="w-4 h-4 text-[#8B8D91]" />
                      <span>Help & Support Desk</span>
                    </button>
                  )}
                </div>

                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 mt-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
