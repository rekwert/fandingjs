import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/hooks/useI18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartLine, Bell, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FundingRateTableProps {
  selectedExchanges: number[];
  searchTerm: string;
  rateFilter: string;
}

export function FundingRateTable({ selectedExchanges, searchTerm, rateFilter }: FundingRateTableProps) {
  const { t, language } = useI18n();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<string>('fundingRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['/api/funding-rates/latest'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter rates based on props
  const filteredRates = rates.filter((rate: any) => {
    // Exchange filter
    if (selectedExchanges.length > 0 && !selectedExchanges.includes(rate.exchangeId)) {
      return false;
    }

    // Search filter
    if (searchTerm && !rate.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Rate filter
    const rateValue = parseFloat(rate.fundingRate);
    switch (rateFilter) {
      case 'high':
        return Math.abs(rateValue) > 0.001; // > 0.1%
      case 'very-high':
        return Math.abs(rateValue) > 0.002; // > 0.2%
      case 'hot':
        return Math.abs(rateValue) > 0.002; // > 0.2% (hot)
      default:
        return true;
    }
  });

  // Sort rates
  const sortedRates = [...filteredRates].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'fundingRate') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (sortField === 'nextFundingTime') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate
  const paginatedRates = sortedRates.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sortedRates.length / pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatFundingRate = (rate: string) => {
    const rateValue = parseFloat(rate) * 100;
    const isPositive = rateValue > 0;
    return {
      value: `${isPositive ? '+' : ''}${rateValue.toFixed(3)}%`,
      isPositive,
      isHot: Math.abs(rateValue) > 0.2,
    };
  };

  const formatTimeUntilFunding = (nextFundingTime: string) => {
    const now = new Date();
    const funding = new Date(nextFundingTime);
    const diffMs = funding.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Прошло';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}ч ${diffMinutes}м`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-800 dark:bg-slate-800">
            <TableRow className="border-slate-700">
              <TableHead className="text-gray-300">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('exchange')}
                  className="text-gray-300 hover:text-white p-0"
                >
                  {t('table.exchange')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-gray-300">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('symbol')}
                  className="text-gray-300 hover:text-white p-0"
                >
                  {t('table.asset')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right text-gray-300">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('fundingRate')}
                  className="text-gray-300 hover:text-white p-0"
                >
                  {t('table.fundingRate')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right text-gray-300">
                {t('table.nextFunding')}
              </TableHead>
              <TableHead className="text-right text-gray-300">
                {t('table.updated')}
              </TableHead>
              <TableHead className="text-center text-gray-300">
                {t('table.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRates.map((rate: any) => {
              const fundingRate = formatFundingRate(rate.fundingRate);
              const timeUntilFunding = formatTimeUntilFunding(rate.nextFundingTime);
              
              return (
                <TableRow 
                  key={`${rate.exchangeId}-${rate.symbol}`}
                  className={`border-slate-700 hover:bg-slate-800 ${fundingRate.isHot ? 'bg-red-500/10 border-l-4 border-l-red-500' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: rate.exchange.color }}
                      >
                        {rate.exchange.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{rate.exchange.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-white">{rate.symbol}</span>
                      {fundingRate.isHot && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                          {t('table.hot')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span 
                      className={`font-mono font-bold text-lg ${
                        fundingRate.isPositive ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {fundingRate.value}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-gray-300">{timeUntilFunding}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-gray-400">
                      {format(new Date(rate.timestamp), 'HH:mm', { 
                        locale: language === 'ru' ? ru : undefined 
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                        <ChartLine className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-300">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="bg-slate-800 dark:bg-slate-800 px-4 py-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{t('table.showEntries')}</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="25" className="text-gray-300">25</SelectItem>
                <SelectItem value="50" className="text-gray-300">50</SelectItem>
                <SelectItem value="100" className="text-gray-300">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-400">
              {t('table.ofEntries').replace('{{total}}', sortedRates.length.toLocaleString())}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={page === pageNum ? "bg-blue-600 text-white" : "border-slate-600 text-gray-300 hover:bg-slate-700"}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
