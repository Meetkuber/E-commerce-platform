import app from './app';
import { testConnection } from './db/connection';
import { EmailService } from './services/email.service';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Prevent crashes from unhandled errors
process.on('unhandledRejection', (reason: any) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error: Error) => {
    console.error('⚠️  Uncaught Exception:', error.message);
});

async function startServer() {
    // Test database connection
    await testConnection();

    // Initialize email service eagerly
    try {
        await EmailService.getTransporter();
    } catch (e) {
        console.warn('⚠️  Email service initialization failed, emails will not be sent');
    }

    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 E-Commerce Platform Server                 ║
║                                                  ║
║   Server:  http://localhost:${PORT}               ║
║   API:     http://localhost:${PORT}/api           ║
║   Health:  http://localhost:${PORT}/api/health    ║
║                                                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
        `);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

