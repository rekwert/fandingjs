import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FundingRateTable } from './FundingRateTable';
import { Charts } from './Charts';
import { NotificationModal } from './NotificationModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, AlertTriangle } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { isConnected, lastMessage } = useWebSocket(user?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchanges, setSelectedExchanges] = useState<number[]>([]);
  const [rateFilter, setRateFilter] = useState('all');
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const { data: exchanges = [] } = useQuery({
    queryKey: ['/api/exchanges'],
  });

  const { data: hotRates = [] } = useQuery({
    queryKey: ['/api/funding-rates/hot/0.002'],
    refetchInterval: 60000,
  });

  const handleExchangeToggle = (exchangeId: number) => {
    setSelectedExchanges(prev => 
      prev.includes(exchangeId) 
        ? prev.filter(id => id !== exchangeId)
        : [...prev, exchangeId]
    );
  };

  const lastUpdate = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Header exchangeCount={exchanges.length} lastUpdate={lastUpdate} />
      
      <div className="flex">
        <Sidebar 
          selectedExchanges={selectedExchanges}
          onExchangeToggle={handleExchangeToggle}
          onNotificationClick={() => setNotificationModalOpen(true)}
        />
        
        <main className="flex-1 overflow-x-hidden">
          {/* Header with Filters */}
          <div className="bg-slate-900 border-b border-slate-700 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-white">{t('dashboard.title')}</h2>
                <p className="text-sm text-gray-400">
                  {t('dashboard.lastUpdate')}: <span className="text-blue-400">{lastUpdate} UTC</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('dashboard.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <Select value={rateFilter} onValueChange={setRateFilter}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-gray-300">
                      {t('dashboard.allRates')}
                    </SelectItem>
                    <SelectItem value="high" className="text-gray-300">
                      {t('dashboard.onlyHigh')}
                    </SelectItem>
                    <SelectItem value="very-high" className="text-gray-300">
                      {t('dashboard.onlyVeryHigh')}
                    </SelectItem>
                    <SelectItem value="hot" className="text-gray-300">
                      {t('dashboard.onlyHot')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-800">
                  <Filter className="h-4 w-4 mr-2" />
                  {t('dashboard.filters')}
                </Button>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          {hotRates.length > 0 && (
            <Alert className="mx-4 mt-4 bg-yellow-500/10 border-yellow-500/20 border-l-4 border-l-yellow-500">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong className="text-yellow-400">{t('dashboard.highRatesAlert')}</strong>
                <br />
                {t('dashboard.coinsNeedAttention').replace('{{count}}', hotRates.length.toString())}
              </AlertDescription>
            </Alert>
          )}

          {/* WebSocket Connection Status */}
          {!isConnected && (
            <Alert className="mx-4 mt-4 bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">
                Соединение с сервером потеряно. Данные могут быть неактуальными.
              </AlertDescription>
            </Alert>
          )}

          {/* Data Table */}
          <div className="m-4">
            <FundingRateTable 
              selectedExchanges={selectedExchanges}
              searchTerm={searchTerm}
              rateFilter={rateFilter}
            />
          </div>

          {/* Charts Section */}
          <div className="m-4">
            <Charts />
          </div>
        </main>
      </div>

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />
    </div>
  );
}
