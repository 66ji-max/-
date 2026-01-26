import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载所有环境变量（包括 .env 中的）
  const env = loadEnv(mode, process.cwd(), '');

  // 优先读取 GEMINI_API_KEY，如果没有则尝试读取 VITE_GEMINI_API_KEY
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // 将 Key 安全地注入到前端代码的 process.env 中
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});