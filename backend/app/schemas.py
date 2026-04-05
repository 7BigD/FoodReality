from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ========== Member ==========
class MemberRegisterRequest(BaseModel):
    phone: str
    name: Optional[str] = ""


class MemberResponse(BaseModel):
    id: int
    phone: str
    name: str
    points: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ========== Queue ==========
class TakeNumberRequest(BaseModel):
    member_id: Optional[int] = None  # 取号不强制注册，可为空


class QueueResponse(BaseModel):
    id: int
    queue_number: str
    member_id: Optional[int] = None
    glasses_id: Optional[int] = None
    status: str
    created_at: datetime
    called_at: Optional[datetime] = None
    member: Optional[MemberResponse] = None

    model_config = {"from_attributes": True}


class QueueStatusResponse(BaseModel):
    total_waiting: int
    estimated_wait_minutes: int


# ========== Glasses ==========
class GlassesBindRequest(BaseModel):
    member_phone: str        # 手机号，B端店员输入
    queue_number: str        # 排队号，如 A001


class GlassesResponse(BaseModel):
    id: int
    device_code: str
    status: str
    current_member_id: Optional[int] = None
    current_member_phone: Optional[str] = None
    current_queue_id: Optional[int] = None
    bound_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GlassesGameReportRequest(BaseModel):
    score: int


class QueueProgressResponse(BaseModel):
    device_code: str
    queue_number: Optional[str] = None
    position: int                          # 1-based，0 表示不在队列中
    total_waiting: int
    should_notify: bool                    # position <= 3 时为 True
    message: str


# ========== Store ==========
class StoreUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None


class StoreResponse(BaseModel):
    id: int
    name: str
    address: str
    phone: str
    business_hours: str
    logo_url: str
    cover_url: str

    model_config = {"from_attributes": True}


# ========== Product ==========
class ProductCreateRequest(BaseModel):
    store_id: int = 1
    name: str
    price: float
    sale_price: float
    image_url: Optional[str] = ""
    is_hot: Optional[bool] = False
    sales_7d: Optional[int] = 0
    description: Optional[str] = ""


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    image_url: Optional[str] = None
    is_hot: Optional[bool] = None
    sales_7d: Optional[int] = None
    description: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    store_id: int
    name: str
    price: float
    sale_price: float
    image_url: str
    is_hot: bool
    sales_7d: int
    description: str

    model_config = {"from_attributes": True}


# ========== Sample ==========
class SampleUpdateRequest(BaseModel):
    total_count: Optional[int] = None
    remaining_count: Optional[int] = None


class SampleClaimRequest(BaseModel):
    member_id: int


class SampleResponse(BaseModel):
    id: int
    store_id: int
    product_name: str
    total_count: int
    remaining_count: int

    model_config = {"from_attributes": True}


class SampleRecordResponse(BaseModel):
    id: int
    member_id: int
    sample_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ========== Game ==========
class GameRecordCreateRequest(BaseModel):
    member_id: int
    glasses_id: int
    score: int


class GameRecordResponse(BaseModel):
    id: int
    member_id: int
    glasses_id: int
    score: int
    reward_threshold: int
    reward_earned: bool
    reward_claimed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ========== Dashboard ==========
class DashboardOverviewResponse(BaseModel):
    today_members: int
    today_samples: int
    queue_count: int
    glasses_in_use: int
    total_members: int
