import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middlewares.js';
import dotenv from 'dotenv'; // 환경 변수 관리 라이브러리 가져오기
import jwt from 'jsonwebtoken';

// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();

// 아이템 생성 api
router.post('/items', authMiddleware, async (req, res, next) => {
  try {
    // 인증 미들웨어를 통해 현재 사용자의 정보를 가져옵니다.
    const { userid } = req.user;

    // 사용자 인증 후에도 userId가 없으면 에러 반환
    if (!userid) {
      return res.status(401).json({ error: '유저 아이디가 없습니다.' });
    }

    // 요청 본문에서 아이템 데이터를 추출합니다.
    const { code, itemname, ability, price } = req.body;

    // 필수 데이터가 제공되었는지 확인합니다.
    if (!code || !itemname || !ability || price == null) {
      return res.status(400).json({
        error: 'Item code, Item name, ability, price를 기입해주세요. ',
      });
    }

    // 아이템 능력(`ability`)이 올바른 JSON 형식인지 확인합니다.
    if (typeof ability !== 'object' || Array.isArray(ability)) {
      return res.status(400).json({
        error: '아이템 능력이 올바른 형식이 아닙니다.',
      });
    }

    // Prisma를 사용해 데이터베이스에 새로운 아이템을 생성합니다.
    const item = await prisma.item.create({
      data: {
        code, // 아이템 코드
        itemname, // 아이템 이름
        ability, // JSON 형식의 아이템 능력 (Prisma는 Json 타입을 지원)
        price: +price, // 아이템 가격을 숫자로 변환하여 저장
        userid: userid, // 현재 사용자 ID를 저장하여 소유권 설정
      },
    });

    // 생성된 아이템 데이터를 상태 코드 201과 함께 클라이언트에 반환합니다.
    return res.status(201).json({ data: item });
  } catch (error) {
    console.error('Error creating item:', error); // 디버깅용 로그
    // 에러 발생 시 next()를 호출하여 에러 처리 미들웨어로 전달합니다.
    next(error);
  }
});


/** 아이템 수정 API **/
router.put('/posts/:itemid/refresh', async (req, res, next) => {
    const { itemid } = req.params;
    const { title, content, password } = req.body;
  
    const post = await prisma.posts.findUnique({
      where: { postId: +postId },
    });
  
    if (!post)
      return res.status(404).json({ message: '아이템이 존재하지 않습니다.' });
    else if (post.password !== password)
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  
    await prisma.posts.update({
      data: {
          title: title,
          content: content,
        },
      where: {
        postId: +postId,
        password: password,
      },
    });
  
    return res.status(200).json({ data: '아이템이 수정되었습니다.' });
  });

// 아이템 목록 조회
router.get('/posts', async (req, res, next) => {
    const posts = await prisma.posts.findMany({
      select: {
        postid: true,
        userid: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc', // 아이템 목록을 최신순으로 정렬합니다.
      },
    });
  
    return res.status(200).json({ data: posts });
  });



// 아이템 상세 조회

router.get('/posts/:itemId', async (req, res, next) => {
    const { postId } = req.params;
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
      select: {
        postid: true,
        userid: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  
    return res.status(200).json({ data: post });
  });


export default router;