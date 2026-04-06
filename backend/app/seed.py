"""初始化种子数据（Demo 演示用）"""
from .database import engine, SessionLocal, Base
from .models import Store, Product, Sample, Glasses


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 店铺信息（仅一条）
        if not db.query(Store).first():
            store = Store(
                name="港记茶餐厅",
                address="深圳市南山区万象天地 B1层 L108",
                phone="0755-86001234",
                business_hours="10:00 - 22:00",
                # 真实港式茶餐厅门面
                logo_url="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop&q=80",
                # 港式茶餐厅内部暖色调氛围
                cover_url="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1024&h=600&fit=crop&q=80",
            )
            db.add(store)
            db.flush()
            store_id = store.id

            # 商品 — 使用参考页面中的真实饮品图 + Unsplash 真实食物图
            products = [
                Product(store_id=store_id, name="招牌珍珠奶茶", price=28.0, sale_price=22.0,
                    image_url="https://img1.baidu.com/it/u=3705419426,4167756276&fm=253&app=138&f=JPEG?w=800&h=1067",
                    is_hot=True, sales_7d=523, description="醇厚锡兰红茶与手作珍珠的经典碰撞"),
                Product(store_id=store_id, name="芒果芝士奶盖", price=32.0, sale_price=26.0,
                    image_url="https://hellorfimg.zcool.cn/provider_image/preview260/2236886441.jpg",
                    is_hot=True, sales_7d=487, description="鲜甜芒果果泥配以细腻海盐芝士奶盖"),
                Product(store_id=store_id, name="满杯红柚", price=22.0, sale_price=18.0,
                    image_url="https://pic.ulecdn.com/pic/user_800160676/product/prd20211116/acd41dd5e047dd8b_p800x800_xl.jpeg",
                    is_hot=True, sales_7d=612, description="甄选红心西柚，满杯果肉爆浆沁爽"),
                Product(store_id=store_id, name="干炒牛河", price=38.0, sale_price=35.0,
                    image_url="https://gips2.baidu.com/it/u=1641570611,1957745901&fm=3074&app=3074&f=JPEG",
                    is_hot=False, sales_7d=289, description="镬气十足，经典粤菜"),
                Product(store_id=store_id, name="港式奶茶", price=22.0, sale_price=18.0,
                    image_url="https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=400&fit=crop&q=80",
                    is_hot=False, sales_7d=356, description="丝袜奶茶，浓滑香醇"),
                Product(store_id=store_id, name="叉烧饭", price=35.0, sale_price=30.0,
                    image_url="https://miaobi-lite.cdn.bcebos.com/miaobi/5mao/b%27LV8xNzMzMTI4OTgyLjI5OTkzNzc%3D%27/0.png",
                    is_hot=False, sales_7d=245, description="蜜汁叉烧，肥瘦相间"),
                Product(store_id=store_id, name="虾饺皇", price=28.0, sale_price=25.0,
                    image_url="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop&q=80",
                    is_hot=False, sales_7d=198, description="皮薄馅鲜，粤式点心"),
                Product(store_id=store_id, name="杨枝甘露", price=26.0, sale_price=22.0,
                    image_url="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop&q=80",
                    is_hot=False, sales_7d=312, description="芒果西柚椰汁，清甜可口"),
            ]
            db.add_all(products)

            # 样品
            samples = [
                Sample(store_id=store_id, product_name="手打柠檬茶（试饮装）", total_count=50, remaining_count=50),
                Sample(store_id=store_id, product_name="招牌菠萝包（试吃装）", total_count=30, remaining_count=30),
            ]
            db.add_all(samples)

        # 眼镜设备（预置5副）
        if not db.query(Glasses).first():
            glasses_list = [
                Glasses(device_code=f"GL-{i:03d}", status="available")
                for i in range(1, 6)
            ]
            db.add_all(glasses_list)

        db.commit()
        print("✅ 种子数据初始化完成")
    except Exception as e:
        db.rollback()
        print(f"❌ 种子数据初始化失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
