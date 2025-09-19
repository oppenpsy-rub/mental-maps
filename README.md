# Mental Maps Application

A web-based platform for linguistic research that enables the creation and analysis of digital mental maps. Researchers can conduct studies where participants create mental maps of their linguistic perceptions on interactive, scalable maps.

## Features

- **Interactive Map Interface**: OpenStreetMap-based scalable maps with drawing tools
- **Audio Stimuli Integration**: Support for audio playback with various formats
- **Advanced Drawing Tools**: Pen, shapes, text annotations, and heatmap functionality
- **Data Collection & Analysis**: Comprehensive data collection with visualization and export capabilities
- **Multi-language Support**: Configurable for different languages and regions
- **GDPR Compliant**: Privacy-focused data handling and anonymization

## Technology Stack

- **Frontend**: React.js with TypeScript, Leaflet.js, Fabric.js
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: PostgreSQL with PostGIS extension
- **Caching**: Redis
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mental-maps-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```
   Edit the `.env` files with your configuration.

4. **Start development environment with Docker**
   ```bash
   npm run docker:dev
   ```

   Or start services individually:
   ```bash
   # Start database and Redis
   docker-compose -f docker-compose.dev.yml up postgres redis -d
   
   # Start backend
   npm run dev:backend
   
   # Start frontend (in another terminal)
   npm run dev:frontend
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Production Deployment

1. **Build and start with Docker Compose**
   ```bash
   npm run docker:build
   docker-compose up -d
   ```

## Project Structure

```
mental-maps-app/
├── frontend/                 # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/                  # Node.js backend application
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml        # Production Docker configuration
├── docker-compose.dev.yml    # Development Docker configuration
├── package.json              # Root package.json for monorepo
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Lint both applications
- `npm run format` - Format code in both applications
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:build` - Build production Docker images

### Frontend
- `npm run dev --workspace=frontend` - Start frontend development server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run test --workspace=frontend` - Run frontend tests
- `npm run lint --workspace=frontend` - Lint frontend code

### Backend
- `npm run dev --workspace=backend` - Start backend development server
- `npm run build --workspace=backend` - Build backend for production
- `npm run test --workspace=backend` - Run backend tests
- `npm run lint --workspace=backend` - Lint backend code

## Environment Variables

See `.env.example`, `frontend/.env.example`, and `backend/.env.example` for all available configuration options.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.