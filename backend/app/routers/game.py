from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import GameRecord, Member
from ..schemas import GameRecordCreateRequest, GameRecordResponse

router = APIRouter(prefix="/api/games", tags=["游戏"])

DEFAULT_REWARD_THRESHOLD = 100  # 默认达标分数线


@router.post("/record", response_model=GameRecordResponse)
def create_game_record(req: GameRecordCreateRequest, db: Session = Depends(get_db)):
    """提交游戏记录"""
    reward_earned = req.score >= DEFAULT_REWARD_THRESHOLD

    record = GameRecord(
        member_id=req.member_id,
        glasses_id=req.glasses_id,
        score=req.score,
        reward_threshold=DEFAULT_REWARD_THRESHOLD,
        reward_earned=reward_earned,
        reward_claimed=False
    )
    db.add(record)

    # 累加会员积分
    member = db.query(Member).filter(Member.id == req.member_id).first()
    if member:
        member.points += req.score

    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[GameRecordResponse])
def list_game_records(member_id: int = None, db: Session = Depends(get_db)):
    """游戏记录列表（B端）"""
    query = db.query(GameRecord)
    if member_id:
        query = query.filter(GameRecord.member_id == member_id)
    return query.order_by(GameRecord.created_at.desc()).all()


@router.post("/{record_id}/claim-reward", response_model=GameRecordResponse)
def claim_reward(record_id: int, db: Session = Depends(get_db)):
    """兑换奖品"""
    record = db.query(GameRecord).filter(GameRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="游戏记录不存在")
    if not record.reward_earned:
        raise HTTPException(status_code=400, detail="积分未达标，无法兑换")
    if record.reward_claimed:
        raise HTTPException(status_code=400, detail="奖品已兑换")

    record.reward_claimed = True
    db.commit()
    db.refresh(record)
    return record
