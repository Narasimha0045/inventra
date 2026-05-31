from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.models import Order, OrderItem, Product, Customer
from app.schemas.schemas import OrderCreate
from typing import List


def create_order(db: Session, order_data: OrderCreate) -> Order:
    """
    Create an order with items. Validates:
    - Customer exists
    - All products exist
    - Sufficient stock for each item
    Atomically reduces stock and calculates totals.
    """
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {order_data.customer_id} not found"
        )

    # Create order
    order = Order(customer_id=order_data.customer_id, total_amount=0.0)
    db.add(order)
    db.flush()  # Get order ID without committing

    total_amount = 0.0
    order_items = []

    for item_data in order_data.items:
        # Get product with lock for update
        product = db.query(Product).filter(Product.id == item_data.product_id).with_for_update().first()
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item_data.product_id} not found"
            )

        # Check stock
        if product.quantity_in_stock < item_data.quantity:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. "
                       f"Available: {product.quantity_in_stock}, Requested: {item_data.quantity}"
            )

        # Reduce stock
        product.quantity_in_stock -= item_data.quantity

        # Calculate subtotal
        subtotal = round(product.price * item_data.quantity, 2)
        total_amount += subtotal

        # Create order item
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=product.price,
            subtotal=subtotal,
        )
        db.add(order_item)
        order_items.append(order_item)

    # Update order total
    order.total_amount = round(total_amount, 2)

    try:
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order. Transaction rolled back."
        )

    # Eagerly load relationships for the response
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order.id).first()

    return order


def get_orders(db: Session) -> List[Order]:
    """Get all orders with customer and item details."""
    return db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).all()


def get_order(db: Session, order_id: int) -> Order:
    """Get a single order by ID with full details."""
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    return order


def delete_order(db: Session, order_id: int) -> None:
    """Delete an order. Note: stock is NOT restored on deletion."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    db.delete(order)
    db.commit()
