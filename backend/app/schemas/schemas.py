from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


# ─── Standard Response Wrappers ───────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str


# ─── Product Schemas ─────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    sku: str = Field(..., min_length=1, max_length=100, description="Unique SKU")
    price: float = Field(..., gt=0, description="Product price, must be positive")
    quantity_in_stock: int = Field(..., ge=0, description="Stock quantity")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    price: float
    quantity_in_stock: int
    created_at: datetime
    updated_at: datetime


# ─── Customer Schemas ────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Unique email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: Optional[str]
    created_at: datetime


# ─── Order Item Schemas ──────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID")
    quantity: int = Field(..., gt=0, description="Quantity to order")


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    product: Optional[ProductResponse] = None


# ─── Order Schemas ───────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, description="Customer ID")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order items")


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []


# ─── Dashboard Schemas ───────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    inventory_value: float
    low_stock_products: List[ProductResponse]
    recent_orders: List[OrderResponse]
    recent_products: List[ProductResponse]
