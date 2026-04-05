from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Queue, Member
from ..schemas import QueueResponse, QueueStatusResponse

router = APIRouter(prefix="/api/queue", tags=["排队"])

AVERAGE_WAIT_PER_PERSON = 15  # 每人平均等待分钟数


@router.post("/take-number", response_model=QueueResponse)
def take_number(db: Session = Depends(get_db)):
    """取号（无需注册，直接分配排队号）"""

    # 生成排队号：查当日最大号 +1
    today_start = datetime.combine(date.today(), datetime.min.time())
    max_number = db.query(func.max(Queue.queue_number)).filter(
        Queue.created_at >= today_start
    ).scalar()
    if max_number:
        next_num = int(max_number[1:]) + 1
    else:
        next_num = 1
    queue_number = f"A{next_num:03d}"

    queue = Queue(
        queue_number=queue_number,
        member_id=None,
        status="waiting"
    )
    db.add(queue)
    db.commit()
    db.refresh(queue)
    return queue


@router.get("/status", response_model=QueueStatusResponse)
def queue_status(db: Session = Depends(get_db)):
    """当前排队状态（C端）"""
    total = db.query(func.count(Queue.id)).filter(Queue.status == "waiting").scalar()
    return QueueStatusResponse(
        total_waiting=total,
        estimated_wait_minutes=total * AVERAGE_WAIT_PER_PERSON
    )


@router.get("/list", response_model=list[QueueResponse])
def queue_list(status: str = None, db: Session = Depends(get_db)):
    """排队列表（B端）"""
    query = db.query(Queue)
    if status:
        query = query.filter(Queue.status == status)
    return query.order_by(Queue.created_at.desc()).all()


@router.post("/{queue_id}/call", response_model=QueueResponse)
def call_number(queue_id: int, db: Session = Depends(get_db)):
    """叫号"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="排队记录不存在")
    if queue.status != "waiting":
        raise HTTPException(status_code=400, detail="该排队记录状态不是等待中")
    queue.status = "called"
    queue.called_at = datetime.now()
    db.commit()
    db.refresh(queue)
    return queue


@router.post("/{queue_id}/complete", response_model=QueueResponse)
def complete(queue_id: int, db: Session = Depends(get_db)):
    """完成就餐"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="排队记录不存在")
    queue.status = "completed"
    db.commit()
    db.refresh(queue)
    return queue


@router.post("/{queue_id}/cancel", response_model=QueueResponse)
def cancel(queue_id: int, db: Session = Depends(get_db)):
    """取消排队"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="排队记录不存在")
    queue.status = "cancelled"
    db.commit()
    db.refresh(queue)
    return queue
