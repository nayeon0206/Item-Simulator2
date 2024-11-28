import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middlewares.js';
import dotenv from 'dotenv';// 환경 변수 관리 라이브러리 가져오기


// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();

/** 캐릭터 생성 API **/
// 캐릭터 생성 시 중복 이름 체크 및 기본 값 설정
router.post('/characters', authMiddleware, async (req, res, next) => {
  try {
    const { userid } = req.user; // 인증된 사용자 ID
    const { charctername } = req.body; //캐릭터 이름 받기
 // 캐릭터 이름 중복 확인
 const existingCharacter = await prisma.charcter.findFirst({
    where: { charctername, userid },
  });
//중복된 이름이라면 이 메세지를 반환
  if (existingCharacter) {
    return res.status(409).json({ message: '이미 존재하는 캐릭터 이름입니다.' });
  }

  // 캐릭터 생성
  const character = await prisma.charcter.create({
    data: {
      charctername,
      health: 500, // 기본 체력
      power: 100, // 기본 힘
      money: 10000, // 기본 게임 머니
      userid, // 인증된 사용자와 연결
    },
  });

  res.status(201).json({
    message: '캐릭터가 생성되었습니다.',
    characterid: character.charcterid, // 생성된 캐릭터 ID 반환
  });
} catch (error) {
  res.status(500).json({ message: '캐릭터 생성 실패', error: error.message });
}
});

/** 캐릭터 삭제 API **/
// 삭제할 캐릭터가 인증된 사용자 소유인지 확인 후 삭제
router.delete('/:charcterid', authMiddleware, async (req, res) => {
    try {
      const { charcterid } = req.params; // URI에서 캐릭터 ID 추출
      const { userid } = req.user; // 인증된 사용자 ID
  
      // 캐릭터 존재 여부 및 소유 확인
      const character = await prisma.charcter.findFirst({
        where: {
          charcterid: +charcterid,
          userid, // 현재 사용자 소유인지 확인
        },
      });
  
      if (!character) {
        return res.status(404).json({ message: '캐릭터가 존재하지 않거나 권한이 없습니다.' });
      }
  

      //- 삭제할 캐릭터의 ID는 URI의 **parameter**로 전달하기
    // - 예시: `DELETE /api/characters/**321**` ← 321번 캐릭터 삭제! 굵은 글씨가 parameter에요
      // 캐릭터 삭제
      await prisma.charcter.delete({
        where: { charcterid: +charcterid },
      });
  
      res.status(200).json({ message: '캐릭터가 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '캐릭터 삭제 실패', error: error.message });
    }
  });


/** 캐릭터 상세 조회 API **/
router.get('/:charcterid', authMiddleware, async (req, res) => {
  try {
    const { charcterid } = req.params; // URI에서 캐릭터 ID 추출
    const { userid } = req.user; // 인증된 사용자 ID

 // 캐릭터 ID 유효성 확인
 if (!charcterid || isNaN(parseInt(charcterid, 10))) {
    return res.status(400).json({ message: '유효한 캐릭터 ID를 제공해야 합니다.' });
  }

    const character = await prisma.charcter.findFirst({
        where: {
            charcterid: parseInt(charcterid, 10),
          } // 캐릭터 ID로 조회, 정수로 반환하여 조건전달
      });

    if (!character) {
      return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    }

    // 내 캐릭터인지 확인
    const isMyCharacter = character.userid === userid;

    // 반환 데이터 구성
    const response = {
      charctername: character.charctername,
      health: character.health,
      power: character.power,
    };

    // 내 캐릭터라면 게임 머니 포함
    if (isMyCharacter) {
      response.money = character.money;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('캐릭터 상세 조회 실패:', error.message);
    res.status(500).json({ message: '캐릭터 상세 조회 실패', error: error.message });
  }
});

/** 캐릭터 인벤토리 API **/
// 특정 캐릭터의 인벤토리에 아이템 추가
router.post('/:charcterid/inventory', authMiddleware, async (req, res) => {
    try {
      const { charcterid } = req.params; // URI에서 캐릭터 ID 추출
      const { userid } = req.user; // 인증된 사용자 ID
      const { itemName, itemAttributes } = req.body; // 아이템 이름 및 속성
  
      // 캐릭터 존재 확인
      const character = await prisma.charcter.findFirst({
        where: {
          charcterid: +charcterid,
          userid, // 현재 사용자 소유인지 확인
        },
      });
  
      if (!character) {
        return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
      }
  
      // 인벤토리에 아이템 추가
      const inventoryItem = await prisma.inventory.create({
        data: {
          charcterid: +charcterid, // 캐릭터와 연결
          name: itemName, // 아이템 이름
          attributes: itemAttributes, // JSON 형식으로 아이템 속성 저장
        },
      });
  
      res.status(201).json({ inventoryItem });
    } catch (error) {
      res.status(500).json({ message: '인벤토리 추가 실패', error: error.message });
    }
  });

export default router;
