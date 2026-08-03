import app from './app';
import { env } from './config/env';
import { checkDbConnection } from './config/db';

const startServer = async () => {
  try {
    // Attempt database health ping
    const dbConnected = await checkDbConnection();
    if (dbConnected) {
      console.log('✅ Connected to Neon PostgreSQL Database successfully.');
    } else {
      console.log('ℹ️  Running with offline / mock database mode until valid DATABASE_URL is provided.');
    }

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server ready & listening on http://localhost:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('🏁 HTTP server closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
