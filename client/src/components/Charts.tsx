import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartLine, Expand } from 'lucide-react';

export function Charts() {
  const { t } = useI18n();
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('');
  const [timeRange, setTimeRange] = useState('24');

  const { data: exchanges = [] } = useQuery({
    queryKey: ['/api/exchanges'],
  });

  const { data: stats = [] } = useQuery({
    queryKey: ['/api/exchanges/stats'],
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ['/api/funding-rates/history', selectedSymbol, selectedExchange, timeRange],
    enabled: !!selectedSymbol && !!selectedExchange,
  });

  const formatHistoryData = (data: any[]) => {
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      rate: parseFloat(item.fundingRate) * 100,
    }));
  };

  const formatStatsData = (data: any[]) => {
    return data.map(item => ({
      name: item.name,
      count: item.count,
      avgRate: item.avgRate * 100,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Funding Rate History Chart */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">
              {t('charts.historyTitle')}
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={timeRange === '24' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('24')}
                className={timeRange === '24' ? 'bg-blue-600 text-white' : 'border-slate-600 text-gray-300 hover:bg-slate-800'}
              >
                {t('charts.hours24')}
              </Button>
              <Button 
                variant={timeRange === '168' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('168')}
                className={timeRange === '168' ? 'bg-blue-600 text-white' : 'border-slate-600 text-gray-300 hover:bg-slate-800'}
              >
                {t('charts.days7')}
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-2">
            <Select value={selectedExchange} onValueChange={setSelectedExchange}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-gray-300">
                <SelectValue placeholder="Выберите биржу" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {exchanges.map((exchange: any) => (
                  <SelectItem key={exchange.id} value={exchange.id.toString()} className="text-gray-300">
                    {exchange.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-gray-300">
                <SelectValue placeholder="Выберите актив" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="BTCUSDT" className="text-gray-300">BTCUSDT</SelectItem>
                <SelectItem value="ETHUSDT" className="text-gray-300">ETHUSDT</SelectItem>
                <SelectItem value="XRPUSDT" className="text-gray-300">XRPUSDT</SelectItem>
                <SelectItem value="DOGEUSDT" className="text-gray-300">DOGEUSDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {selectedSymbol && selectedExchange && historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatHistoryData(historyData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    tickFormatter={(value) => `${value.toFixed(3)}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number) => [`${value.toFixed(3)}%`, 'Funding Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChartLine className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">График funding rate по времени</p>
                  <p className="text-sm text-gray-500">{t('charts.selectAsset')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Exchange Distribution */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">
              {t('charts.distributionTitle')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatStatsData(stats)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  type="number" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Количество'];
                    return [`${value.toFixed(3)}%`, 'Средняя ставка'];
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
