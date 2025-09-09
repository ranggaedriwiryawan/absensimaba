// start.js - Railway startup script
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Railway deployment...');
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('📦 Environment:', process.env.NODE_ENV || 'development');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the main server
const serverPath = join(__dirname, 'api', 'server.js');
console.log('🏃 Starting server from:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🔚 Server exited with code: ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});