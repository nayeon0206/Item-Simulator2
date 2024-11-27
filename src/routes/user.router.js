import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key'; // .env에서 비밀 키 가져오기

/**
 * 사용자 회원가입 API
 * - 이메일 중복 체크
 * - 비밀번호 암호화 (bcrypt 사용)
 * - Prisma 트랜잭션을 이용해 사용자 데이터 저장
 */

/** 사용자 회원가입 API **/
router.post('/sign-up', async (req, res, next) => {
  const { email, password } = req.body;
  const isExistUser = await prisma.users.findFirst({
    where: {
      email,
    },
  });

  if (isExistUser) {
    return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  // Users 테이블에 사용자를 추가합니다.
  const user = await prisma.users.create({
  data: {
  email,
  password: hashedPassword // 암호화된 비밀번호를 저장합니다.
  },
  });

  return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});


/** 로그인 API **/
router.post('/sign-in', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 사용자 조회
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
      }
  
      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }
  
      // JWT 생성
      const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
  
      // JWT 반환
      res.status(200).json({
        message: '로그인 성공',
      });
    } catch (error) {
      res.status(500).json({ message: '서버 에러', error: error.message });
    }
  });

export default router;
