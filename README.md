# Funding Rate Monitor

Профессиональная веб-платформа для мониторинга funding rate с криптобирж в реальном времени с уведомлениями и аналитикой.

## Возможности

- 🔄 **Мониторинг в реальном времени** - данные с 8 ведущих криптобирж
- 📊 **Профессиональный интерфейс** - темная тема с полной русской локализацией
- 🔐 **Безопасная аутентификация** - интеграция с Replit OAuth
- 📈 **Расширенная аналитика** - графики, фильтрация и сортировка
- 🔔 **Система уведомлений** - Telegram боты и email
- 🎯 **Пользовательские алерты** - настраиваемые пороговые значения
- 📱 **Адаптивный дизайн** - работает на всех устройствах

## Поддерживаемые биржи

- Bybit
- HTX (Huobi)
- Gate.io
- Bitget
- MEXC
- BingX
- Bitmart
- KuCoin

## Технологии

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query для управления состоянием
- Wouter для роутинга
- Vite для сборки

### Backend
- Node.js + Express
- PostgreSQL + Drizzle ORM
- WebSocket для real-time обновлений
- Replit Auth для аутентификации

## Запуск локально

### Требования
- Node.js 18+
- PostgreSQL база данных
- Replit аккаунт (для OAuth)

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd funding-rate-monitor
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения в `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/funding_rates
SESSION_SECRET=your-session-secret-key
REPLIT_DOMAINS=localhost:5000
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-replit-app-id
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

4. Инициализируйте базу данных:
```bash
npm run db:push
```

5. Запустите приложение:
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5000`

## Команды

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка для продакшена
- `npm run start` - запуск продакшен версии
- `npm run db:push` - применение миграций базы данных
- `npm run db:studio` - открытие Drizzle Studio

## API Endpoints

### Аутентификация
- `GET /api/login` - начать OAuth процесс
- `GET /api/logout` - выйти из аккаунта
- `GET /api/auth/user` - получить текущего пользователя

### Данные
- `GET /api/exchanges` - список всех бирж
- `GET /api/funding-rates/latest` - последние funding rates
- `GET /api/funding-rates/hot/:threshold` - "горячие" rates выше порога
- `GET /api/exchanges/stats` - статистика по биржам

### Уведомления
- `GET /api/notifications/settings` - настройки уведомлений
- `POST /api/notifications/settings` - обновить настройки
- `GET /api/alerts` - пользовательские алерты
- `POST /api/alerts` - создать новый алерт

## WebSocket События

- `funding_rates_update` - обновление funding rates
- `hot_rates_alert` - алерт о высоких rates

## Структура проекта

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # React хуки
│   │   └── lib/            # Утилиты и конфигурация
├── server/                 # Express backend
│   ├── services/           # Бизнес логика
│   ├── routes.ts           # API маршруты
│   ├── storage.ts          # База данных
│   └── index.ts            # Точка входа
├── shared/                 # Общие типы и схемы
└── package.json
```

## Развертывание

### Replit (рекомендуется)
1. Импортируйте проект в Replit
2. Настройте переменные окружения
3. Нажмите "Deploy"

### Docker
```bash
docker build -t funding-rate-monitor .
docker run -p 5000:5000 --env-file .env funding-rate-monitor
```

### VPS/сервер
1. Установите Node.js и PostgreSQL
2. Склонируйте репозиторий
3. Настройте переменные окружения
4. Запустите `npm run build && npm start`

## Конфигурация бирж

Биржи настраиваются в `server/services/exchangeService.ts`. Каждая биржа имеет:
- API URL для получения данных
- WebSocket URL для real-time обновлений
- Функции парсинга данных
- Цветовую схему

## Лицензия

MIT License

## Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.