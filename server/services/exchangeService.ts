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
        const response = await fetchWithRetry('https://api.bybit.com/v5/market/tickers?category=linear', {
          headers: {
            'User-Agent': 'FundingRateMonitor/1.0',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        return data.result?.list || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0, // Will be set later
        symbol: data.symbol,
        fundingRate: String(data.fundingRate || '0'),
        nextFundingTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
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
        const response = await fetchWithRetry('https://api.hbdm.com/swap-api/v1/swap_batch_funding_rate', {
          headers: {
            'User-Agent': 'FundingRateMonitor/1.0',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        return data.data || [];
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.contract_code,
        fundingRate: String(data.funding_rate || '0'),
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
        // 1. Получаем список контрактов
        const contractsRes = await fetchWithRetry('https://api.gateio.ws/api/v4/futures/usdt/contracts', {
          headers: {
            'User-Agent': 'FundingRateMonitor/1.0',
            'Accept': 'application/json'
          }
        });
        const contracts = await contractsRes.json();
        // 2. Для каждого контракта получаем funding rate
        const rates: any[] = [];
        for (const contract of contracts) {
          try {
            const rateRes = await fetchWithRetry(
              `https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract=${contract.name}`,
              {
                headers: {
                  'User-Agent': 'FundingRateMonitor/1.0',
                  'Accept': 'application/json'
                }
              }
            );
            const rate = await rateRes.json();
            if (rate) {
              rate.contract = contract.name;
              rates.push(rate);
            }
          } catch (err) {
            console.warn(`[Gate.io] Failed to fetch funding rate for contract ${contract.name}:`, err);
          }
        }
        return rates;
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
        // Получаем список всех символов
        const symbolsRes = await fetchWithRetry('https://api.bitget.com/api/mix/v1/market/symbols');
        const symbolsData = await symbolsRes.json();
        // Фильтруем только нужные контракты (например, USDT-margined)
        const symbols = (symbolsData.data || []).filter((s: any) => s.productType === 'umcbl');
        const rates: any[] = [];
        for (const symbolObj of symbols) {
          const symbol = symbolObj.symbol;
          try {
            const rateRes = await fetchWithRetry(
              `https://api.bitget.com/api/mix/v1/market/funding-rate?symbol=${symbol}`
            );
            const rateData = await rateRes.json();
            if (rateData.data && rateData.data.nextSettleTime) {
              rateData.data.symbol = symbol;
              rates.push(rateData.data);
            }
          } catch (err) {
            console.warn(`[Bitget] Failed to fetch funding rate for symbol ${symbol}:`, err);
          }
        }
        return rates;
      },
      parseFundingRate: (data: any) => {
        // Проверяем валидность даты
        const nextFundingTime = new Date(parseInt(data.nextSettleTime));
        if (isNaN(nextFundingTime.getTime())) {
          throw new Error(`Invalid nextSettleTime for symbol ${data.symbol}`);
        }
        return {
          pairId: 0,
          symbol: data.symbol,
          fundingRate: data.fundingRate,
          nextFundingTime,
          timestamp: new Date(),
        };
      },
    });

    // MEXC
    this.configs.set('mexc', {
      name: 'mexc',
      displayName: 'MEXC',
      apiUrl: 'https://api.mexc.com',
      color: '#ef4444',
      fetchFundingRates: async () => {
        // 1. Получаем список всех контрактов
        const contractsRes = await fetchWithRetry('https://contract.mexc.com/api/v1/contract/detail');
        const contractsData = await contractsRes.json();
        const contracts = contractsData.data || [];
        // 2. Для каждого контракта получаем funding rate
        const rates: any[] = [];
        for (const contract of contracts) {
          const symbol = contract.symbol;
          try {
            const rateRes = await fetchWithRetry(
              `https://contract.mexc.com/api/v1/contract/funding_rate/${symbol}`
            );
            const rateData = await rateRes.json();
            if (rateData.data) {
              rateData.data.symbol = symbol;
              rates.push(rateData.data);
            }
          } catch (err) {
            console.warn(`[MEXC] Failed to fetch funding rate for symbol ${symbol}:`, err);
          }
        }
        return rates;
      },
      parseFundingRate: (data: any) => ({
        pairId: 0,
        symbol: data.symbol,
        fundingRate: data.fundingRate,
        nextFundingTime: new Date(data.nextSettleTime),
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
        const response = await fetchWithRetry('https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex');
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
        const response = await fetchWithRetry('https://api-cloud.bitmart.com/contract/public/details');
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
        const response = await fetchWithRetry('https://api-futures.kucoin.com/api/v1/funding-rate/list');
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
      const fundingRates: InsertFundingRate[] = [];
      for (const data of rawData) {
        try {
          const parsedRate = config.parseFundingRate(data);
          // Create or find trading pair
          const pair = await this.storage.upsertTradingPair({
            symbol: parsedRate.symbol,
            baseAsset: parsedRate.symbol.replace(/USDT|USD|BUSD/, ''),
            quoteAsset: parsedRate.symbol.includes('USDT') ? 'USDT' : 'USD',
            exchangeId: exchange.id,
            isActive: true,
          });

          fundingRates.push({
            ...parsedRate,
            exchangeId: exchange.id,
            pairId: pair.id,
          });
        } catch (error) {
          console.error(`Failed to process funding rate:`, error);
        }
      }

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

// --- Добавляем универсальную функцию fetchWithRetry ---
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 10000): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return response;
    } catch (error) {
      if (attempt === retries) {
        console.error(`[fetchWithRetry] Failed after ${retries} attempts:`, { url, error });
        throw error;
      }
      console.warn(`[fetchWithRetry] Attempt ${attempt} failed for ${url}:`, error);
      await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Unreachable');
}