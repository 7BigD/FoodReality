from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Sample, SampleRecord
from ..schemas import SampleUpdateRequest, SampleClaimRequest, SampleResponse, SampleRecordResponse

router = APIRouter(prefix="/api/samples", tags=["样品"])


@router.get("", response_model=list[SampleResponse])
def list_samples(db: Session = Depends(get_db)):
    """样品列表+库存"""
    return db.query(Sample).all()


@router.put("/{sample_id}", response_model=SampleResponse)
def update_sample(sample_id: int, req: SampleUpdateRequest, db: Session = Depends(get_db)):
    """更新样品库存（B端补仓）"""
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="样品不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sample, key, value)

    db.commit()
    db.refresh(sample)
    return sample


@router.post("/{sample_id}/claim", response_model=SampleRecordResponse)
def claim_sample(sample_id: int, req: SampleClaimRequest, db: Session = Depends(get_db)):
    """领取样品"""
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="样品不存在")
    if sample.remaining_count <= 0:
        raise HTTPException(status_code=400, detail="样品已领完")

    # 校验是否已领取过
    existing = db.query(SampleRecord).filter(
        SampleRecord.member_id == req.member_id,
        SampleRecord.sample_id == sample_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="您已领取过该样品")

    sample.remaining_count -= 1
    record = SampleRecord(member_id=req.member_id, sample_id=sample_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
