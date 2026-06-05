from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status , UploadFile
import pandas as pd
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductUpdate
from typing import List, Optional


def create_product(db: Session, product_data: ProductCreate) -> Product:
    """Create a new product. Raises 409 if SKU already exists."""
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_data.sku}' already exists"
        )
    product = Product(**product_data.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_data.sku}' already exists"
        )
    return product


def get_products(db: Session, search: Optional[str] = None) -> List[Product]:
    """Retrieve all products, optionally filtered by search term."""
    query = db.query(Product)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_term)) |
            (Product.sku.ilike(search_term))
        )
    return query.order_by(Product.created_at.desc()).all()


def get_product(db: Session, product_id: int) -> Product:
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Product:
    """Update a product. Validates SKU uniqueness if changed."""
    product = get_product(db, product_id)
    update_data = product_data.model_dump(exclude_unset=True)

    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(
            Product.sku == update_data["sku"],
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{update_data['sku']}' already exists"
            )

    for key, value in update_data.items():
        setattr(product, key, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Update failed due to a constraint violation"
        )
    return product


def delete_product(db: Session, product_id: int) -> None:
    """Delete a product by ID."""
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()

def import_products(
    db: Session,
    file: UploadFile
):
    df = pd.read_csv(file.file)

    imported = 0
    skipped = 0
    errors = []

    for index, row in df.iterrows():
        try:
            sku = str(row["sku"]).strip()

            existing = (
                db.query(Product)
                .filter(Product.sku == sku)
                .first()
            )

            if existing:
                skipped += 1
                continue

            product = Product(
                name=str(row["name"]).strip(),
                sku=sku,
                price=float(row["price"]),
                quantity_in_stock=int(
                    row["quantity_in_stock"]
                ),
            )

            db.add(product)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(
                f"Row {index + 1}: {str(e)}"
            )

    db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
    }