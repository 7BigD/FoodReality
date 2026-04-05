"""乐奇眼镜简化接口 — Demo 专用，硬编码 GL-001 + 固定 150 分"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Glasses, Member, Queue, GameRecord
from ..schemas import QueueProgressResponse, GameRecordResponse

logger = logging.getLogger("leqi")

router = APIRouter(prefix="/api/leqi", tags=["乐奇眼镜"])

DEMO_DEVICE_CODE = "GL-001"
DEMO_SCORE = 150
REWARD_THRESHOLD = 100


@router.get("/queue-progress", response_model=QueueProgressResponse)
def queue_progress(db: Session = Depends(get_db)):
    """查询排队进度（默认 GL-001，无需传参）"""
    glasses = db.query(Glasses).filter(Glasses.device_code == DEMO_DEVICE_CODE).first()
    if not glasses:
        raise HTTPException(status_code=404, detail=f"演示设备 {DEMO_DEVICE_CODE} 不存在")

    total_waiting = db.query(func.count(Queue.id)).filter(Queue.status == "waiting").scalar()

    if not glasses.current_queue_id:
        return QueueProgressResponse(
            device_code=DEMO_DEVICE_CODE,
            queue_number=None,
            position=0,
            total_waiting=total_waiting,
            should_notify=False,
            message="该眼镜未绑定排队",
        )

    queue = db.query(Queue).filter(Queue.id == glasses.current_queue_id).first()
    if not queue:
        return QueueProgressResponse(
            device_code=DEMO_DEVICE_CODE,
            queue_number=None,
            position=0,
            total_waiting=total_waiting,
            should_notify=False,
            message="排队记录不存在",
        )

    if queue.status != "waiting":
        status_msg = {"called": "已叫号，请尽快就餐", "completed": "已完成就餐", "cancelled": "已取消排队"}
        return QueueProgressResponse(
            device_code=DEMO_DEVICE_CODE,
            queue_number=queue.queue_number,
            position=0,
            total_waiting=total_waiting,
            should_notify=queue.status == "called",
            message=status_msg.get(queue.status, queue.status),
        )

    ahead_count = db.query(func.count(Queue.id)).filter(
        Queue.status == "waiting",
        Queue.created_at < queue.created_at,
    ).scalar()
    position = ahead_count + 1

    should_notify = position <= 3
    if position == 1:
        message = "您是下一位，请准备就餐"
    elif position <= 3:
        message = f"前方还有{position - 1}组，请准备就餐"
    else:
        message = f"前方还有{position - 1}组在等待"

    return QueueProgressResponse(
        device_code=DEMO_DEVICE_CODE,
        queue_number=queue.queue_number,
        position=position,
        total_waiting=total_waiting,
        should_notify=should_notify,
        message=message,
    )


@router.post("/report-game", response_model=GameRecordResponse)
def report_game(db: Session = Depends(get_db)):
    """上报游戏完成 + 领取奖励（默认 GL-001，固定 150 分，无需传参）"""
    glasses = db.query(Glasses).filter(Glasses.device_code == DEMO_DEVICE_CODE).first()
    if not glasses:
        raise HTTPException(status_code=404, detail=f"演示设备 {DEMO_DEVICE_CODE} 不存在")

    if not glasses.current_member_id:
        raise HTTPException(status_code=400, detail="该眼镜未绑定用户，无法记录游戏")

    reward_earned = DEMO_SCORE >= REWARD_THRESHOLD

    record = GameRecord(
        member_id=glasses.current_member_id,
        glasses_id=glasses.id,
        score=DEMO_SCORE,
        reward_threshold=REWARD_THRESHOLD,
        reward_earned=reward_earned,
        reward_claimed=False,
    )
    db.add(record)

    member = db.query(Member).filter(Member.id == glasses.current_member_id).first()
    if member:
        member.points += DEMO_SCORE

    db.commit()
    db.refresh(record)

    logger.info(
        "[LEQI_GAME] 用户ID=%s, 得分=%d, 奖励=%s",
        glasses.current_member_id, DEMO_SCORE, reward_earned,
    )
    return record
