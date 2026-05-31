from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.models import Product, Customer, Order, OrderItem
from app.schemas.schemas import DashboardSummary, ProductResponse, OrderResponse
from app.core.config import get_settings

settings = get_settings()


def get_dashboard_summary(db: Session) -> dict:
    """Get dashboard summary with KPIs, low stock products, recent orders, and recent products."""
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # Calculate inventory value
    inventory_value = db.query(
        func.sum(Product.price * Product.quantity_in_stock)
    ).scalar() or 0.0

    # Low stock products
    low_stock = db.query(Product).filter(
        Product.quantity_in_stock <= settings.LOW_STOCK_THRESHOLD
    ).order_by(Product.quantity_in_stock.asc()).all()

    # Recent orders (last 5)
    recent_orders = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).limit(5).all()

    # Recently added products (last 5)
    recent_products = db.query(Product).order_by(
        Product.created_at.desc()
    ).limit(5).all()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "inventory_value": round(inventory_value, 2),
        "low_stock_products": low_stock,
        "recent_orders": recent_orders,
        "recent_products": recent_products,
    }
