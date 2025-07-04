import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/useI18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings } from 'lucide-react';

interface SidebarProps {
  selectedExchanges: number[];
  onExchangeToggle: (exchangeId: number) => void;
  onNotificationClick: () => void;
}

export function Sidebar({ selectedExchanges, onExchangeToggle, onNotificationClick }: SidebarProps) {
  const { t } = useI18n();

  const { data: exchanges = [] } = useQuery({
    queryKey: ['/api/exchanges'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/exchanges/stats'],
  });

  const { data: hotRates = [] } = useQuery({
    queryKey: ['/api/funding-rates/hot/0.002'],
  });

  const maxRate = Math.max(...hotRates.map((r: any) => parseFloat(r.fundingRate) * 100));
  const totalTracking = stats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0;

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 dark:border-slate-700 h-full">
      <div className="p-4">
        {/* Quick Stats */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('sidebar.quickStats')}
          </h3>
          <div className="space-y-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{t('sidebar.hotCoins')}</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    {hotRates.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{t('sidebar.maxRate')}</span>
                  <span className="text-sm font-mono font-semibold text-green-400">
                    +{maxRate.toFixed(3)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{t('sidebar.tracking')}</span>
                  <span className="text-sm font-mono font-semibold text-blue-400">
                    {totalTracking.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exchange Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('sidebar.exchanges')}
          </h3>
          <div className="space-y-2">
            {exchanges.map((exchange: any) => {
              const stat = stats?.find((s: any) => s.exchangeId === exchange.id);
              const isSelected = selectedExchanges.includes(exchange.id);
              
              return (
                <div key={exchange.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exchange-${exchange.id}`}
                    checked={isSelected}
                    onCheckedChange={() => onExchangeToggle(exchange.id)}
                    className="border-gray-600 data-[state=checked]:bg-blue-500"
                  />
                  <label
                    htmlFor={`exchange-${exchange.id}`}
                    className="flex-1 flex items-center justify-between text-sm text-gray-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: exchange.color }}
                      />
                      <span>{exchange.displayName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {stat?.count || 0}
                    </Badge>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button 
            onClick={onNotificationClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            {t('sidebar.setupNotifications')}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-slate-600 text-gray-300 hover:bg-slate-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('sidebar.settings')}
          </Button>
        </div>
      </div>
    </aside>
  );
}
