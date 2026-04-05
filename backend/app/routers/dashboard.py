from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Member, SampleRecord, Queue, Glasses
from ..schemas import DashboardOverviewResponse

router = APIRouter(prefix="/api/dashboard", tags=["看板"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def overview(db: Session = Depends(get_db)):
    """聚合数据概览"""
    today_start = datetime.combine(date.today(), datetime.min.time())

    today_members = db.query(func.count(Member.id)).filter(
        Member.created_at >= today_start
    ).scalar()

    today_samples = db.query(func.count(SampleRecord.id)).filter(
        SampleRecord.created_at >= today_start
    ).scalar()

    queue_count = db.query(func.count(Queue.id)).filter(
        Queue.status == "waiting"
    ).scalar()

    glasses_in_use = db.query(func.count(Glasses.id)).filter(
        Glasses.status == "in_use"
    ).scalar()

    total_members = db.query(func.count(Member.id)).scalar()

    return DashboardOverviewResponse(
        today_members=today_members,
        today_samples=today_samples,
        queue_count=queue_count,
        glasses_in_use=glasses_in_use,
        total_members=total_members
    )
