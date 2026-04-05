from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Member
from ..schemas import MemberRegisterRequest, MemberResponse

router = APIRouter(prefix="/api/members", tags=["会员"])


@router.post("/register", response_model=MemberResponse)
def register(req: MemberRegisterRequest, db: Session = Depends(get_db)):
    """注册/登录：手机号存在则返回，不存在则创建"""
    member = db.query(Member).filter(Member.phone == req.phone).first()
    if member:
        # 已注册用户：如果库里没名字，但这次传了名字，则补填
        if not member.name and req.name:
            member.name = req.name
            db.commit()
            db.refresh(member)
        return member
    member = Member(phone=req.phone, name=req.name or "")
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.get("", response_model=list[MemberResponse])
def list_members(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """会员列表（B端）"""
    return db.query(Member).offset((page - 1) * size).limit(size).all()


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db)):
    """会员详情"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")
    return member
