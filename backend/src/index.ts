import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { prisma } from './prisma.js';
import { teamRoundProgressService } from './services/teamRoundProgressService.js';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🦑 SQUID PROTOCOL — SURVIVE THE SYSTEM API ENGINE`);
  console.log(`📡 Listening on http://${HOST}:${PORT}`);
  console.log(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

const roundReconciliation = setInterval(() => {
  void teamRoundProgressService.reconcileExpiredRounds().catch((error) => {
    console.error('Team round progression reconciliation failed:', error);
  });
}, 5000);
roundReconciliation.unref();

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  clearInterval(roundReconciliation);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma database client disconnected.');
    process.exit(0);
  });

  // Force close after 10s if stuck
  setTimeout(() => {
    console.error('Forceful shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
