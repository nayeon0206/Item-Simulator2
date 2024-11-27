import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 아이템 생성
router.post(
    '/posts/:itemid/create',
    authMiddleware,
    async (req, res, next) => {
      const { itemid } = req.params;
      const { userId } = req.user;
      const { itemname } = req.body;
  
      const post = await prisma.posts.findFirst({
        where: {
            itemid: +itemid,
        },
      });
      if (!post)
        return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  
      const comment = await prisma.comments.create({
        data: {
          userId: +userId, //  ID
          postId: +postId, // 댓글 작성 게시글 ID
          content: content,
        },
      });
  
      return res.status(201).json({ data: comment });
    },
  );


/** 아이템 수정 API **/
router.put('/posts/:itemid/refresh', async (req, res, next) => {
    const { itemid } = req.params;
    const { title, content, password } = req.body;
  
    const post = await prisma.posts.findUnique({
      where: { postId: +postId },
    });
  
    if (!post)
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
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
  
    return res.status(200).json({ data: '게시글이 수정되었습니다.' });
  });

// 아이템 목록 조회
router.get('/posts/:itemId/create', async (req, res, next) => {
    const { postId } = req.params;
  
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post)
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });
  
    const comments = await prisma.comments.findMany({
      where: {
        postId: +postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  
    return res.status(200).json({ data: comments });
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