from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Store
from ..schemas import StoreUpdateRequest, StoreResponse

router = APIRouter(prefix="/api/store", tags=["店铺"])


@router.get("", response_model=StoreResponse)
def get_store(db: Session = Depends(get_db)):
    """获取店铺信息"""
    store = db.query(Store).first()
    if not store:
        raise HTTPException(status_code=404, detail="店铺信息未配置")
    return store


@router.put("", response_model=StoreResponse)
def update_store(req: StoreUpdateRequest, db: Session = Depends(get_db)):
    """更新店铺信息"""
    store = db.query(Store).first()
    if not store:
        store = Store()
        db.add(store)

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(store, key, value)

    db.commit()
    db.refresh(store)
    return store
