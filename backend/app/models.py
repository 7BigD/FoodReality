from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Member(Base):
    __tablename__ = "member"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(11), unique=True, nullable=False, index=True)
    name = Column(String(50), default="")
    points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

    queues = relationship("Queue", back_populates="member")
    sample_records = relationship("SampleRecord", back_populates="member")
    game_records = relationship("GameRecord", back_populates="member")


class Queue(Base):
    __tablename__ = "queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    queue_number = Column(String(10), nullable=False)
    member_id = Column(Integer, ForeignKey("member.id"), nullable=True)
    glasses_id = Column(Integer, ForeignKey("glasses.id"), nullable=True)
    status = Column(String(20), default="waiting")  # waiting / called / completed / cancelled
    created_at = Column(DateTime, default=datetime.now)
    called_at = Column(DateTime, nullable=True)

    member = relationship("Member", back_populates="queues")
    glasses = relationship("Glasses", foreign_keys=[glasses_id], back_populates="queues")


class Glasses(Base):
    __tablename__ = "glasses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_code = Column(String(50), unique=True, nullable=False)
    status = Column(String(20), default="available")  # available / in_use / charging / offline
    current_member_id = Column(Integer, ForeignKey("member.id"), nullable=True)
    current_queue_id = Column(Integer, ForeignKey("queue.id"), nullable=True)
    bound_at = Column(DateTime, nullable=True)

    queues = relationship("Queue", foreign_keys="[Queue.glasses_id]", back_populates="glasses")


class Store(Base):
    __tablename__ = "store"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), default="")
    address = Column(String(200), default="")
    phone = Column(String(20), default="")
    business_hours = Column(String(100), default="")
    logo_url = Column(String(500), default="")
    cover_url = Column(String(500), default="")


class Product(Base):
    __tablename__ = "product"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("store.id"), nullable=False)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    image_url = Column(String(500), default="")
    is_hot = Column(Boolean, default=False)
    sales_7d = Column(Integer, default=0)
    description = Column(Text, default="")


class Sample(Base):
    __tablename__ = "sample"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("store.id"), nullable=False)
    product_name = Column(String(100), nullable=False)
    total_count = Column(Integer, default=0)
    remaining_count = Column(Integer, default=0)


class SampleRecord(Base):
    __tablename__ = "sample_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("member.id"), nullable=False)
    sample_id = Column(Integer, ForeignKey("sample.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    member = relationship("Member", back_populates="sample_records")


class GameRecord(Base):
    __tablename__ = "game_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("member.id"), nullable=False)
    glasses_id = Column(Integer, ForeignKey("glasses.id"), nullable=False)
    score = Column(Integer, default=0)
    reward_threshold = Column(Integer, default=100)
    reward_earned = Column(Boolean, default=False)
    reward_claimed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    member = relationship("Member", back_populates="game_records")
