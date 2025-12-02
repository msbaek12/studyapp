import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 1. 현재 환경 변수를 모두 가져옵니다.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // 2. 여기가 핵심 수정 사항입니다!
    define: {
      // 브라우저에서 'process.env'를 찾을 때 에러가 나지 않도록 객체를 만들어줍니다.
      'process.env': {
        // Vercel에 설정한 키 이름(GEMINI_API_KEY)을 여기서 연결해줍니다.
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        // 혹시 코드에서 API_KEY라고 부르는 경우를 대비해 하나 더 연결합니다.
        API_KEY: JSON.stringify(env.GEMINI_API_KEY),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
