import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartLine, Globe, Bell, TrendingUp, Users, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChartLine className="text-blue-400 h-8 w-8 mr-3" />
              <h1 className="text-xl font-bold text-white">Funding Rate Monitor</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Войти
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
              Мониторинг Funding Rate
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Отслеживайте ставки финансирования с ведущих криптобирж в реальном времени. 
              Получайте уведомления о выгодных возможностях.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Начать мониторинг
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-slate-600 text-gray-300 hover:bg-slate-800 text-lg px-8 py-3"
              >
                Узнать больше
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Возможности платформы</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Профессиональные инструменты для мониторинга ставок финансирования
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Реальное время</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Мониторинг funding rate с 8 ведущих бирж. Обновление данных каждую минуту через WebSocket.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Умные уведомления</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Настраиваемые уведомления в Telegram и Email при превышении пороговых значений.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <ChartLine className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Аналитика</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Исторические графики, статистика по биржам и анализ трендов funding rate.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Мультиязычность</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Поддержка русского и английского языков. Интуитивно понятный интерфейс.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Множество бирж</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Bybit, HTX, Gate.io, Bitget, MEXC, BingX, Bitmart, KuCoin и другие.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-cyan-400" />
                </div>
                <CardTitle className="text-white">Безопасность</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Только официальные API бирж. Никаких API ключей - только публичные данные.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Supported Exchanges */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Поддерживаемые биржи</h2>
            <p className="text-xl text-gray-400">
              Мониторинг данных с ведущих криптовалютных бирж
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Bybit', color: '#f7931a' },
              { name: 'HTX', color: '#2e7bff' },
              { name: 'Gate.io', color: '#7c3aed' },
              { name: 'Bitget', color: '#f59e0b' },
              { name: 'MEXC', color: '#ef4444' },
              { name: 'BingX', color: '#06b6d4' },
              { name: 'Bitmart', color: '#8b5cf6' },
              { name: 'KuCoin', color: '#10b981' },
            ].map((exchange) => (
              <div key={exchange.name} className="flex items-center justify-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: exchange.color }}
                  >
                    {exchange.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-white">{exchange.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Начните отслеживать funding rate сегодня
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Присоединяйтесь к трейдерам, которые используют наш сервис для поиска арбитражных возможностей
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-12 py-4"
          >
            Войти и начать мониторинг
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <ChartLine className="text-blue-400 h-6 w-6 mr-2" />
              <span className="font-semibold text-white">Funding Rate Monitor</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Funding Rate Monitor. Все права защищены.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
