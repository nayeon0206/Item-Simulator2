import jwt from 'jsonwebtoken';
import { prisma } from '../utiles/prisma/index.js';

const SECRET_KEY = 'your-secret-key'; // JWT 서명에 사용한 비밀 키

export default async function authMiddleware(req, res, next) {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('인증 헤더가 없거나 올바르지 않습니다.');
    }

    // 2. Bearer 토큰에서 JWT 추출
    const token = authHeader.split(' ')[1];

    // 3. JWT 검증
    const decoded = jwt.verify(token, SECRET_KEY);

    // 4. 토큰에서 추출한 userId로 사용자 조회
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    // 5. 요청 객체(req)에 사용자 정보를 추가
    req.user = user;

    // 6. 다음 미들웨어 실행
    next();
  } catch (error) {
    // 7. 에러 처리: 인증 실패 시 401 상태 코드 반환
    return res
      .status(401)
      .json({ message: error.message ?? '인증 실패: 유효하지 않은 요청입니다.' });
  }
}
