# Как скачать проект Funding Rate Monitor

## Способ 1: Скачивание через Replit (Рекомендуется)

### Шаг 1: Экспорт из Replit
1. Откройте ваш проект в Replit
2. Нажмите на три точки (...) в левом верхнем углу
3. Выберите "Download as zip"
4. Проект скачается как архив

### Шаг 2: Распаковка и настройка
1. Распакуйте архив в нужную папку
2. Откройте терминал/командную строку в папке проекта
3. Установите зависимости:
```bash
npm install
```

## Способ 2: Клонирование репозитория (если настроен Git)

```bash
git clone <URL-вашего-репозитория>
cd funding-rate-monitor
npm install
```

## Настройка для локальной разработки

### 1. Установите PostgreSQL
- **Windows**: Скачайте с https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`

### 2. Создайте базу данных
```sql
CREATE DATABASE funding_rates;
CREATE USER funding_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE funding_rates TO funding_user;
```

### 3. Настройте переменные окружения
Скопируйте файл `.env.example` в `.env` и заполните:

```env
DATABASE_URL=postgresql://funding_user:secure_password@localhost:5432/funding_rates
SESSION_SECRET=ваш-случайный-секретный-ключ-длиной-минимум-32-символа
REPLIT_DOMAINS=localhost:5000
ISSUER_URL=https://replit.com/oidc
REPL_ID=ваш-replit-app-id
```

### 4. Примените миграции базы данных
```bash
npm run db:push
```

### 5. Запустите проект
```bash
npm run dev
```

Проект будет доступен по адресу: http://localhost:5000

## Развертывание на продакшене

### VPS/Выделенный сервер

1. **Установите зависимости на сервере:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
```

2. **Настройте PostgreSQL:**
```bash
sudo -u postgres createdb funding_rates
sudo -u postgres createuser funding_user
sudo -u postgres psql -c "ALTER USER funding_user WITH PASSWORD 'secure_password';"
```

3. **Загрузите проект:**
```bash
git clone <your-repo-url>
cd funding-rate-monitor
npm install
npm run build
```

4. **Настройте переменные окружения в продакшене:**
```env
DATABASE_URL=postgresql://funding_user:secure_password@localhost:5432/funding_rates
SESSION_SECRET=очень-длинный-случайный-ключ-для-продакшена
REPLIT_DOMAINS=yourdomain.com
NODE_ENV=production
```

5. **Запустите:**
```bash
npm run start
```

### Docker

1. **Создайте Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

2. **Запустите:**
```bash
docker build -t funding-rate-monitor .
docker run -p 5000:5000 --env-file .env funding-rate-monitor
```

### Nginx прокси (для продакшена)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Настройка OAuth (Replit Auth)

1. Зайдите в настройки Replit
2. Создайте новое OAuth приложение
3. Укажите redirect URI: `https://yourdomain.com/api/callback`
4. Скопируйте `REPL_ID` в переменные окружения

## Настройка Telegram бота (опционально)

1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Добавьте `TELEGRAM_BOT_TOKEN` в .env файл

## Проверка работы

После запуска проверьте:
- ✅ Главная страница загружается
- ✅ Вход через OAuth работает
- ✅ WebSocket подключается
- ✅ База данных работает
- ✅ API возвращает данные

## Структура файлов проекта

```
funding-rate-monitor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы
│   │   ├── hooks/          # React хуки
│   │   └── lib/            # Утилиты
├── server/                 # Express backend
│   ├── services/           # Бизнес логика
│   └── routes.ts           # API маршруты
├── shared/                 # Общие типы
├── package.json
├── README.md               # Документация
├── .env.example           # Пример переменных
└── DOWNLOAD_GUIDE.md      # Этот файл
```

## Поддержка

Если возникли проблемы:
1. Проверьте что PostgreSQL запущен
2. Убедитесь что все переменные окружения настроены
3. Проверьте логи: `npm run dev` покажет ошибки
4. Убедитесь что порт 5000 свободен

## Дополнительные команды

- `npm run build` - собрать проект для продакшена
- `npm run start` - запустить продакшен версию
- `npm run db:studio` - открыть Drizzle Studio для работы с БД
- `npm run db:push` - применить изменения схемы БД