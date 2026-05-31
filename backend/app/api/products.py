from fastapi import APIRouter, Depends, Query ,UploadFile, File ,HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.services import product_service
import pandas as pd
from app.models.models import Product

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=dict, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    result = product_service.create_product(db, product)
    return {"success": True, "data": ProductResponse.model_validate(result).model_dump()}


@router.get("", response_model=dict)
def list_products(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """List all products with optional search."""
    results = product_service.get_products(db, search)
    return {
        "success": True,
        "data": [ProductResponse.model_validate(p).model_dump() for p in results],
    }


@router.get("/{product_id}", response_model=dict)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a product by ID."""
    result = product_service.get_product(db, product_id)
    return {"success": True, "data": ProductResponse.model_validate(result).model_dump()}


@router.put("/{product_id}", response_model=dict)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """Update a product."""
    result = product_service.update_product(db, product_id, product)
    return {"success": True, "data": ProductResponse.model_validate(result).model_dump()}


@router.delete("/{product_id}", response_model=dict)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    product_service.delete_product(db, product_id)
    return {"success": True, "data": None}

@router.post("/import")
async def import_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

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
                quantity_in_stock=int(row["quantity_in_stock"]),
            )

            db.add(product)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {index+1}: {str(e)}")

    db.commit()

    return {
        "success": True,
        "data": {
            "imported": imported,
            "skipped": skipped,
            "errors": errors,
        },
    }
