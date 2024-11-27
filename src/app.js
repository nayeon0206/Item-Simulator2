import express from 'express';
import dotenv from 'dotenv';
import UsersRouter from './routes/user.router.js';
import Charouter from './routes/cha.router.js'
import authMiddleware from './middlewares/auth.middlewares.js'; // JWT 인증 미들웨어

// .env 파일을 읽어서 환경 변수로 추가
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3018;

// 전역 미들웨어 설정
app.use(express.json());

// 라우터 연결 (JWT 인증 필요)
app.use('/api/users', UsersRouter); // Users 관련 API
app.use('/api/cha', authMiddleware, Charouter); // Characters 관련 API (JWT 인증 필수)

// 서버 시작
app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
