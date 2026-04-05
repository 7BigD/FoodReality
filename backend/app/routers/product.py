from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product
from ..schemas import ProductCreateRequest, ProductUpdateRequest, ProductResponse

router = APIRouter(prefix="/api/products", tags=["商品"])


@router.get("", response_model=list[ProductResponse])
def list_products(hot: bool = None, db: Session = Depends(get_db)):
    """商品列表，支持 ?hot=true 筛选热销"""
    query = db.query(Product)
    if hot is not None:
        query = query.filter(Product.is_hot == hot)
    return query.all()


@router.post("", response_model=ProductResponse)
def create_product(req: ProductCreateRequest, db: Session = Depends(get_db)):
    """新增商品"""
    product = Product(**req.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, req: ProductUpdateRequest, db: Session = Depends(get_db)):
    """编辑商品"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """删除商品"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    db.delete(product)
    db.commit()
    return {"success": True}
