import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Glasses, Member, Queue, GameRecord
from ..schemas import GlassesBindRequest, GlassesResponse, QueueProgressResponse, GlassesGameReportRequest, GameRecordResponse

logger = logging.getLogger("glasses")

router = APIRouter(prefix="/api/glasses", tags=["眼镜"])


def notify_hardware_bind(glasses_device_code: str, member_phone: str, queue_number: Optional[str]):
    """
    [硬件接口预留] 眼镜绑定时通知硬件设备
    TODO: 对接真实硬件 — 通过蓝牙/串口将用户信息推送至AR眼镜
    """
    logger.info(
        "[HARDWARE_BIND] 眼镜 %s 已绑定用户 %s (排队ID: %s) — 等待硬件对接",
        glasses_device_code, member_phone, queue_number
    )


def notify_hardware_unbind(glasses_device_code: str):
    """
    [硬件接口预留] 眼镜解绑时通知硬件设备
    TODO: 对接真实硬件 — 通知AR眼镜停止游戏、清除用户数据
    """
    logger.info(
        "[HARDWARE_UNBIND] 眼镜 %s 已解绑 — 等待硬件对接",
        glasses_device_code
    )


@router.get("", response_model=list[GlassesResponse])
def list_glasses(db: Session = Depends(get_db)):
    """眼镜列表+状态（B端库存管理），关联会员手机号"""
    glasses_list = db.query(Glasses).all()
    result = []
    for g in glasses_list:
        data = GlassesResponse.model_validate(g)
        if g.current_member_id:
            member = db.query(Member).filter(Member.id == g.current_member_id).first()
            if member:
                data.current_member_phone = member.phone
        result.append(data)
    return result


@router.post("/{glasses_id}/bind", response_model=GlassesResponse)
def bind_glasses(glasses_id: int, req: GlassesBindRequest, db: Session = Depends(get_db)):
    """绑定眼镜（B端：输入手机号 + 排队号 → 自动关联）"""
    glasses = db.query(Glasses).filter(Glasses.id == glasses_id).first()
    if not glasses:
        raise HTTPException(status_code=404, detail="眼镜不存在")
    if glasses.status != "available":
        raise HTTPException(status_code=400, detail="该眼镜当前不可用")

    # 按手机号查会员，不存在则自动注册（店员操作时顺带建档）
    member = db.query(Member).filter(Member.phone == req.member_phone).first()
    if not member:
        member = Member(phone=req.member_phone, name="")
        db.add(member)
        db.flush()  # 获取 member.id，不提交事务
        logger.info("[GLASSES_BIND] 新会员自动注册 phone=%s", req.member_phone)

    # 按排队号查队列记录（取当天 waiting/called 状态的）
    queue = db.query(Queue).filter(
        Queue.queue_number == req.queue_number,
        Queue.status.in_(["waiting", "called"])
    ).order_by(Queue.created_at.desc()).first()
    if not queue:
        raise HTTPException(status_code=404, detail=f"排队号 {req.queue_number} 不存在或已完成")

    # 将排队记录关联到该会员（取号时可能没有 member_id）
    queue.member_id = member.id

    glasses.status = "in_use"
    glasses.current_member_id = member.id
    glasses.current_queue_id = queue.id
    glasses.bound_at = datetime.now()
    db.commit()
    db.refresh(glasses)

    # === 日志 & 硬件预留 ===
    logger.info(
        "[GLASSES_BIND] 绑定成功 | 眼镜=%s, 用户=%s(%s), 排队号=%s, 时间=%s",
        glasses.device_code, member.phone, member.name, req.queue_number, glasses.bound_at
    )
    notify_hardware_bind(glasses.device_code, member.phone, req.queue_number)

    # 填充手机号返回
    response = GlassesResponse.model_validate(glasses)
    response.current_member_phone = member.phone
    return response


@router.post("/{glasses_id}/unbind", response_model=GlassesResponse)
def unbind_glasses(glasses_id: int, db: Session = Depends(get_db)):
    """解绑眼镜（归还回收）"""
    glasses = db.query(Glasses).filter(Glasses.id == glasses_id).first()
    if not glasses:
        raise HTTPException(status_code=404, detail="眼镜不存在")

    device_code = glasses.device_code
    old_member_id = glasses.current_member_id

    glasses.status = "available"
    glasses.current_member_id = None
    glasses.current_queue_id = None
    glasses.bound_at = None
    db.commit()
    db.refresh(glasses)

    # === 日志 & 硬件预留 ===
    logger.info(
        "[GLASSES_UNBIND] 解绑成功 | 眼镜=%s, 原用户ID=%s",
        device_code, old_member_id
    )
    notify_hardware_unbind(device_code)

    return glasses


# ========== 乐奇眼镜硬件调用接口 ==========

DEFAULT_REWARD_THRESHOLD = 100


@router.get("/device/{device_code}/queue-progress", response_model=QueueProgressResponse)
def queue_progress(device_code: str, db: Session = Depends(get_db)):
    """查询排队进度（眼镜硬件调用，判断是否提醒用户即将叫号）"""
    from sqlalchemy import func

    glasses = db.query(Glasses).filter(Glasses.device_code == device_code).first()
    if not glasses:
        raise HTTPException(status_code=404, detail="设备不存在")

    total_waiting = db.query(func.count(Queue.id)).filter(Queue.status == "waiting").scalar()

    # 眼镜未绑定排队
    if not glasses.current_queue_id:
        return QueueProgressResponse(
            device_code=device_code,
            queue_number=None,
            position=0,
            total_waiting=total_waiting,
            should_notify=False,
            message="该眼镜未绑定排队",
        )

    queue = db.query(Queue).filter(Queue.id == glasses.current_queue_id).first()
    if not queue:
        return QueueProgressResponse(
            device_code=device_code,
            queue_number=None,
            position=0,
            total_waiting=total_waiting,
            should_notify=False,
            message="排队记录不存在",
        )

    # 非 waiting 状态
    if queue.status != "waiting":
        status_msg = {"called": "已叫号，请尽快就餐", "completed": "已完成就餐", "cancelled": "已取消排队"}
        return QueueProgressResponse(
            device_code=device_code,
            queue_number=queue.queue_number,
            position=0,
            total_waiting=total_waiting,
            should_notify=queue.status == "called",
            message=status_msg.get(queue.status, queue.status),
        )

    # 计算排队位置：比当前队列 created_at 更早且 status=waiting 的数量 + 1
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
        device_code=device_code,
        queue_number=queue.queue_number,
        position=position,
        total_waiting=total_waiting,
        should_notify=should_notify,
        message=message,
    )


@router.post("/device/{device_code}/report-game", response_model=GameRecordResponse)
def report_game(device_code: str, req: GlassesGameReportRequest, db: Session = Depends(get_db)):
    """上报游戏完成（眼镜硬件调用，记录积分）"""
    glasses = db.query(Glasses).filter(Glasses.device_code == device_code).first()
    if not glasses:
        raise HTTPException(status_code=404, detail="设备不存在")

    if not glasses.current_member_id:
        raise HTTPException(status_code=400, detail="该眼镜未绑定用户，无法记录游戏")

    reward_earned = req.score >= DEFAULT_REWARD_THRESHOLD

    record = GameRecord(
        member_id=glasses.current_member_id,
        glasses_id=glasses.id,
        score=req.score,
        reward_threshold=DEFAULT_REWARD_THRESHOLD,
        reward_earned=reward_earned,
        reward_claimed=False,
    )
    db.add(record)

    # 累加会员积分
    member = db.query(Member).filter(Member.id == glasses.current_member_id).first()
    if member:
        member.points += req.score

    db.commit()
    db.refresh(record)

    logger.info(
        "[GAME_REPORT] 眼镜=%s, 用户ID=%s, 得分=%d, 奖励=%s",
        device_code, glasses.current_member_id, req.score, reward_earned,
    )
    return record
