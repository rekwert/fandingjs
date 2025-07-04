import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartLine, Moon, Sun, Globe } from 'lucide-react';

interface HeaderProps {
  exchangeCount: number;
  lastUpdate: string;
}

export function Header({ exchangeCount, lastUpdate }: HeaderProps) {
  const { user } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-slate-900 dark:bg-slate-900 border-b border-slate-800 dark:border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ChartLine className="text-blue-400 h-8 w-8 mr-3" />
              <h1 className="text-xl font-bold text-white">{t('nav.title')}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">
                {t('nav.connected').replace('{{count}}', exchangeCount.toString())}
              </span>
            </div>
            
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => changeLanguage('ru')} className="text-gray-300 hover:text-white">
                  Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-gray-300 hover:text-white">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="text-gray-300 hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-gray-300 hover:text-white">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {user?.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user?.firstName || t('nav.user')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem className="text-gray-300 hover:text-white">
                  <a href="/api/logout" className="w-full">Выйти</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
