import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 아이템 생성 api
router.post('/posts', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    const { title, content } = req.body;
  
    const post = await prisma.posts.create({
      data: {
        userId: +userId,
        title,
        content,
      },
    });
  
    return res.status(201).json({ data: post });
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
        postId: true,
        userId: true,
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
        postId: true,
        userId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  
    return res.status(200).json({ data: post });
  });


export default router;