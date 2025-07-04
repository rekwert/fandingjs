import { storage, type IStorage } from "../storage";
import type { Exchange, InsertFundingRate, FundingRateWithExchange } from "@shared/schema";

interface ExchangeConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  wsUrl?: string;
  color: string;
  fetchFundingRates: () => Promise<any[]>;
  parseFundingRate: (data: any) => Omit<InsertFundingRate, 'exchangeId'>;
}

export class ExchangeService {
  private exchanges: Map<string, Exchange> = new Map();
  private configs: Map<string, ExchangeConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private dataUpdateCallback?: (rates: FundingRateWithExchange[]) => void;

  constructor(private storage: IStorage) {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Bybit
    this.configs.set('bybit', {
      name: 'bybit',
      displayName: 'Bybit',
      apiUrl: 'https://api.bybit.com',
      wsUrl: 'wss://stream.bybit.com/v5/public/linear',
      color: '#f7931a',
      fetchFundingRates: async () => {
        const response = await fetch('https://api.bybit.com/v5/market/funding/history?category=linear&limit=200');
        const data = await response.json();
        return data.result?.list || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0, // Will be set later
        symbol: data.symbol,
        fundingRate: data.fundingRate,
        nextFundingTime: new Date(parseInt(data.fundingRateTimestamp)),
        timestamp: new Date(),
      }),
    });

    // HTX (Huobi)
    this.configs.set('htx', {
      name: 'htx',
      displayName: 'HTX',
      apiUrl: 'https://api.huobi.pro',
      color: '#2e7bff',
      fetchFundingRates: async () => {
        const response = await fetch('https://api.huobi.pro/swap-api/v1/swap_batch_funding_rate');
        const data = await response.json();
        return data.data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.contract_code,
        fundingRate: data.funding_rate,
        nextFundingTime: new Date(data.next_funding_time),
        timestamp: new Date(),
      }),
    });

    // Gate.io
    this.configs.set('gate', {
      name: 'gate',
      displayName: 'Gate.io',
      apiUrl: 'https://api.gateio.ws',
      color: '#7c3aed',
      fetchFundingRates: async () => {
        const response = await fetch('https://api.gateio.ws/api/v4/futures/usdt/funding_rate');
        const data = await response.json();
        return data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.contract,
        fundingRate: data.r,
        nextFundingTime: new Date(data.t * 1000),
        timestamp: new Date(),
      }),
    });

    // Bitget
    this.configs.set('bitget', {
      name: 'bitget',
      displayName: 'Bitget',
      apiUrl: 'https://api.bitget.com',
      color: '#f59e0b',
      fetchFundingRates: async () => {
        const response = await fetch('https://api.bitget.com/api/mix/v1/market/current-fundRate?productType=umcbl');
        const data = await response.json();
        return data.data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.fundingRate,
        nextFundingTime: new Date(parseInt(data.nextSettleTime)),
        timestamp: new Date(),
      }),
    });

    // MEXC
    this.configs.set('mexc', {
      name: 'mexc',
      displayName: 'MEXC',
      apiUrl: 'https://api.mexc.com',
      color: '#ef4444',
      fetchFundingRates: async () => {
        const response = await fetch('https://api.mexc.com/api/v3/premiumIndex');
        const data = await response.json();
        return data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.lastFundingRate,
        nextFundingTime: new Date(data.nextFundingTime),
        timestamp: new Date(),
      }),
    });

    // BingX
    this.configs.set('bingx', {
      name: 'bingx',
      displayName: 'BingX',
      apiUrl: 'https://open-api.bingx.com',
      color: '#06b6d4',
      fetchFundingRates: async () => {
        const response = await fetch('https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex');
        const data = await response.json();
        return data.data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.lastFundingRate,
        nextFundingTime: new Date(data.nextFundingTime),
        timestamp: new Date(),
      }),
    });

    // Bitmart
    this.configs.set('bitmart', {
      name: 'bitmart',
      displayName: 'Bitmart',
      apiUrl: 'https://api-cloud.bitmart.com',
      color: '#8b5cf6',
      fetchFundingRates: async () => {
        const response = await fetch('https://api-cloud.bitmart.com/contract/public/details');
        const data = await response.json();
        return data.data?.symbols || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.funding_rate,
        nextFundingTime: new Date(data.next_funding_time),
        timestamp: new Date(),
      }),
    });

    // KuCoin
    this.configs.set('kucoin', {
      name: 'kucoin',
      displayName: 'KuCoin',
      apiUrl: 'https://api-futures.kucoin.com',
      color: '#10b981',
      fetchFundingRates: async () => {
        const response = await fetch('https://api-futures.kucoin.com/api/v1/funding-rate/list');
        const data = await response.json();
        return data.data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.fundingRate,
        nextFundingTime: new Date(data.timePointNext),
        timestamp: new Date(),
      }),
    });
  }

  async initializeExchanges() {
    for (const [name, config] of this.configs) {
      try {
        const exchange = await this.storage.upsertExchange({
          name: config.name,
          displayName: config.displayName,
          apiUrl: config.apiUrl,
          wsUrl: config.wsUrl,
          color: config.color,
          isActive: true,
        });
        this.exchanges.set(name, exchange);
      } catch (error) {
        console.error(`Failed to initialize exchange ${name}:`, error);
      }
    }
  }

  async fetchExchangeData(exchangeName: string) {
    const config = this.configs.get(exchangeName);
    const exchange = this.exchanges.get(exchangeName);

    if (!config || !exchange) {
      console.error(`Exchange ${exchangeName} not found`);
      return;
    }

    try {
      const rawData = await config.fetchFundingRates();
      const fundingRates: InsertFundingRate[] = rawData.map(data => ({
        ...config.parseFundingRate(data),
        exchangeId: exchange.id,
      }));

      if (fundingRates.length > 0) {
        await this.storage.insertFundingRates(fundingRates);
        console.log(`Updated ${fundingRates.length} funding rates for ${exchangeName}`);
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${exchangeName}:`, error);
    }
  }

  async start() {
    // Start periodic data fetching for all exchanges
    for (const exchangeName of this.configs.keys()) {
      // Initial fetch
      await this.fetchExchangeData(exchangeName);

      // Set up interval for periodic fetching (every minute)
      const interval = setInterval(async () => {
        await this.fetchExchangeData(exchangeName);
        
        // Trigger data update callback
        if (this.dataUpdateCallback) {
          const latestRates = await this.storage.getLatestFundingRates();
          this.dataUpdateCallback(latestRates);
        }
      }, 60000); // 1 minute

      this.intervals.set(exchangeName, interval);
    }

    console.log('Exchange service started');
  }

  async stop() {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    console.log('Exchange service stopped');
  }

  onDataUpdate(callback: (rates: FundingRateWithExchange[]) => void) {
    this.dataUpdateCallback = callback;
  }
}
