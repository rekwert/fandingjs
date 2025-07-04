# Funding Rate Monitor

## Overview

This is a cryptocurrency funding rate monitoring platform that tracks funding rates from major cryptocurrency exchanges in real-time. The application specializes in monitoring perpetual contract funding rates and provides alerts for high-rate opportunities. It's similar to p2p.army but focused specifically on funding rate analysis.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: wouter for lightweight client-side routing
- **Build Tool**: Vite for development and building
- **Theme**: Dark mode with light mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Authentication**: Replit Auth with OpenID Connect
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for live data updates
- **API Integration**: REST and WebSocket connections to cryptocurrency exchanges

### Key Components

1. **Exchange Service**: Manages connections to multiple cryptocurrency exchanges
   - Bybit, HTX (Huobi), Gate.io, Bitget, MEXC, BingX, Bitmart, KuCoin
   - Fetches funding rates via REST APIs and WebSocket streams
   - Handles rate limiting and connection management

2. **Notification Service**: Manages user alerts and notifications
   - Telegram bot integration for instant alerts
   - Email notifications support
   - Custom threshold-based alerts

3. **Real-time Updates**: WebSocket implementation for live data streaming
   - Updates funding rates every minute
   - Broadcasts changes to connected clients
   - Handles connection recovery and authentication

4. **Data Storage**: PostgreSQL schema for structured data
   - Users, exchanges, trading pairs, funding rates
   - Notification settings and custom alerts
   - Session management for authentication

## Data Flow

1. **Exchange Data Collection**:
   - Exchange Service connects to multiple crypto exchanges
   - Fetches funding rates via APIs (REST/WebSocket preferred)
   - Stores data in PostgreSQL with timestamps

2. **Real-time Distribution**:
   - WebSocket server broadcasts updates to connected clients
   - Frontend receives live updates and updates UI
   - Data refreshes every minute or based on exchange capabilities

3. **User Interactions**:
   - Authentication via Replit Auth (Google, Telegram, Email)
   - Users can filter by exchange, asset, or funding rate thresholds
   - Notification settings stored per user

4. **Alert System**:
   - Background service monitors for high funding rates (>0.2%)
   - Triggers notifications via Telegram or email
   - Customizable thresholds and frequency per user

## External Dependencies

### Authentication
- **Replit Auth**: OAuth integration with Google, Telegram, Email/Password
- **Session Management**: PostgreSQL-based session store

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations

### Exchange APIs
- **Bybit**: REST API + WebSocket for funding rates
- **HTX (Huobi)**: REST API integration
- **Gate.io, Bitget, MEXC, BingX, Bitmart, KuCoin**: REST API integrations
- All exchanges use official public APIs without authentication

### Notifications
- **Telegram Bot API**: For instant push notifications
- **Email Service**: For email-based alerts (configurable)

### UI Components
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Headless UI primitives
- **Recharts**: Data visualization for funding rate charts
- **TanStack Query**: Server state management and caching

## Deployment Strategy

### Development
- **Hot Reload**: Vite development server with HMR
- **Database**: Development database with migrations
- **Environment Variables**: Local .env configuration

### Production
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Database Migrations**: Drizzle migrations via `db:push` command
- **Process Management**: Single Node.js process serving both API and static files
- **WebSocket**: Integrated into Express server

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for OAuth
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for notifications
- `ISSUER_URL`: OAuth issuer URL (defaults to Replit)

## Changelog

- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.