import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = express.Router();
const SECRET_KEY = 'your-secret-key'; // JWT 토큰 서명에 사용할 비밀 키

/**
 * 사용자 회원가입 API
 * - 이메일 중복 체크
 * - 비밀번호 암호화 (bcrypt 사용)
 * - Prisma 트랜잭션을 이용해 사용자 데이터 저장
 */
router.post('/sign-up', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일 중복 체크: 동일한 이메일이 이미 데이터베이스에 존재하면 409 에러 반환
    const isExistUser = await prisma.users.findFirst({ where: { email } });
    if (isExistUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 암호화: bcrypt로 해싱 처리하여 안전하게 저장
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성: Prisma를 사용하여 데이터베이스에 사용자 데이터 삽입
    const user = await prisma.users.create({
      data: {
        email, // 이메일 저장
        password: hashedPassword, // 해싱된 비밀번호 저장
      },
    });

    // 회원가입 성공 메시지 반환
    res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    // Prisma 고유 제약 조건 위반 (예: 이메일 중복)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
      }
    }

    // 기타 서버 에러 처리
    res.status(500).json({ message: '서버 에러', error: err.message });
  }
});

/**
 * 사용자 로그인 API
 * - 이메일 존재 여부 확인
 * - 비밀번호 검증 (bcrypt.compare 사용)
 * - JWT 토큰 생성 및 반환
 */
router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일 확인: 사용자가 입력한 이메일이 데이터베이스에 존재하는지 확인
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 이메일입니다.' }); // 이메일 없을 경우 401 에러
    }

    // 비밀번호 검증: bcrypt.compare로 사용자가 입력한 비밀번호와 해싱된 비밀번호 비교
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' }); // 비밀번호가 틀린 경우 401 에러
    }

    // JWT 토큰 생성: 사용자의 ID를 페이로드에 포함하여 토큰 생성
    const token = jwt.sign({ userId: user.userId }, SECRET_KEY, { expiresIn: '1h' });

    // 로그인 성공 메시지와 토큰 반환
    res.status(200).json({ message: '로그인에 성공하였습니다.'});
  } catch (err) {
    // 기타 서버 에러 처리
    res.status(500).json({ message: '서버 에러', error: err.message });
  }
});

export default router;