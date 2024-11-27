import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middlewares.js';

const router = express.Router();

/** 캐릭터 생성 API **/
router.post('/posts', authMiddleware, async (req, res, next) => {
    console.log(req.user);
    const { userid } = req.user;
    const { name } = req.body;
    // console.log(userId, name, post);
    const post = await prisma.posts.create({
      data: {
        userid: +userid,
        charctername: name,
        health: 500,
        power: 100,
        money: 10000,
      },
    });
    return res.status(201).json({ data: post });
  });

// 캐릭터 삭제 구현하기 // 
router.delete('/posts/:postId', async (req, res, next) => {
    const { userid } = req.params;
    const { password } = req.body;
  
    const post = await prisma.posts.findFirst({ where: { userid: +userid } });
  
    if (!post)
      return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    else if (post.password !== password)
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  
    await prisma.posts.delete({ where: { userid: +userid } });
  
    return res.status(200).json({ data: '캐릭터가 삭제되었습니다.' });
  });

/** 캐릭터 조회 API **/
router.get('/posts', async (req, res, next) => {
    const posts = await prisma.posts.findMany({
      select: {
        charcterid: true,
        userid: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc', // 캐릭터를 최신순으로 정렬합니다.
      },
    });
  
    return res.status(200).json({ data: posts });
  });

  /** 캐릭터 상세 조회 API **/
router.get('/posts/:charcterid', async (req, res, next) => {
    const { charcterid } = req.params;
    const post = await prisma.posts.findFirst({
      where: {
        charcterid: charcterid,
      },
      select: {
        charcterid: true,
        userid: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  
    return res.status(200).json({ data: post });
  });

export default router;