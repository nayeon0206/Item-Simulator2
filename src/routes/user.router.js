import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv'; // 환경 변수 관리 라이브러리 가져오기

// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'custom_secret_key'; //.env에서 비밀 키 가져오기

/**
 * 사용자 회원가입 API
 * - 이메일 중복 체크
 * - 비밀번호 암호화 (bcrypt 사용)
 * - Prisma 트랜잭션을 이용해 사용자 데이터 저장
 */
// 입력값 검증 함수
const validateSignUpInput = (email, password) => {
  // 이메일 형식 검증 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 이메일이 없거나 정규식에 맞지 않으면 에러 메시지 반환
  if (!email || !emailRegex.test(email)) {
    return '유효한 이메일 주소를 입력하세요.';
  }

  // 비밀번호가 없거나 6자 미만이면 에러 메시지 반환
  if (!password || password.length < 6) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }

  // 모든 조건이 통과되면 null 반환
  return null;
};

// ** 사용자 회원가입 API **
router.post('/sign-up', async (req, res) => {
  // 요청 본문에서 이메일과 비밀번호를 추출
  const { email, password } = req.body;

  // 입력값 검증
  const errorMessage = validateSignUpInput(email, password);
  if (errorMessage) {
    // 입력값이 잘못되었을 경우 400 상태 코드와 에러 메시지 반환
    return res.status(400).json({ message: errorMessage });
  }

  try {
    // 이메일 중복 체크
    const isExistUser = await prisma.users.findFirst({
      where: { email }, // 이메일이 일치하는 사용자를 검색
    });

    if (isExistUser) {
      // 이미 존재하는 이메일일 경우 409 상태 코드와 메시지 반환
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해싱 (bcrypt를 사용하여 비밀번호를 암호화)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성 (Prisma를 통해 사용자 데이터를 DB에 저장)
    const user = await prisma.users.create({
      data: {
        email, // 이메일 저장
        password: hashedPassword, // 해싱된 비밀번호 저장
      },
    });

    // 성공 응답 (201 상태 코드와 사용자 정보 반환)
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.userid, // 사용자 ID
        email: user.email, // 이메일
        createdAt: user.createdAt, // 생성일시
      },
    });
  } catch (error) {
    // 서버 에러 처리
    console.error(error);
    res.status(500).json({ message: '서버 에러', error: error.message });
  }
});

// ** 로그인 API **
router.post('/sign-in', async (req, res) => {
  // 요청 본문에서 이메일과 비밀번호를 추출
  const { email, password } = req.body;

  try {
    // 사용자 조회 (Prisma를 사용하여 이메일로 사용자 검색)
    const user = await prisma.users.findFirst({ where: { email } });

    if (!user) {
      // 이메일이 존재하지 않을 경우 401 상태 코드와 메시지 반환
      return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }

    // 비밀번호 검증 (bcrypt로 저장된 비밀번호와 비교)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // 비밀번호가 일치하지 않으면 401 상태 코드와 메시지 반환
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 생성
    const token = jwt.sign(
      {
        userId: user.userid, // 사용자 ID (페이로드에 추가)
        email: user.email, // 이메일 (페이로드에 추가)
      },
      SECRET_KEY, // 비밀 키를 사용하여 서명
      { expiresIn: '1h' } // 토큰 유효 기간 설정 (1시간)
    );

    // 성공 응답 (200 상태 코드와 JWT 토큰 반환)
    res.status(200).json({
      message: '로그인 성공',
      token: `Bearer ${token}`, // "Bearer" 형식으로 토큰 반환
    });
  } catch (error) {
    // 서버 에러 처리
    console.error(error);
    res.status(500).json({ message: '서버 에러', error: error.message });
  }
});
  

export default router;
