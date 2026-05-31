from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.schemas import OrderCreate, OrderResponse
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=dict, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order with stock validation and auto-reduction."""
    result = order_service.create_order(db, order)
    return {"success": True, "data": OrderResponse.model_validate(result).model_dump()}


@router.get("", response_model=dict)
def list_orders(db: Session = Depends(get_db)):
    """List all orders with details."""
    results = order_service.get_orders(db)
    return {
        "success": True,
        "data": [OrderResponse.model_validate(o).model_dump() for o in results],
    }


@router.get("/{order_id}", response_model=dict)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order details by ID."""
    result = order_service.get_order(db, order_id)
    return {"success": True, "data": OrderResponse.model_validate(result).model_dump()}


@router.delete("/{order_id}", response_model=dict)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete an order."""
    order_service.delete_order(db, order_id)
    return {"success": True, "data": None}
