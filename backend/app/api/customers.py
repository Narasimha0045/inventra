from fastapi import APIRouter, Depends, Query ,UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.schemas.schemas import CustomerCreate, CustomerResponse
from app.services import customer_service
import pandas as pd
from app.models.models import Customer

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=dict, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer."""
    result = customer_service.create_customer(db, customer)
    return {"success": True, "data": CustomerResponse.model_validate(result).model_dump()}


@router.get("", response_model=dict)
def list_customers(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """List all customers with optional search."""
    results = customer_service.get_customers(db, search)
    return {
        "success": True,
        "data": [CustomerResponse.model_validate(c).model_dump() for c in results],
    }


@router.get("/{customer_id}", response_model=dict)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a customer by ID."""
    result = customer_service.get_customer(db, customer_id)
    return {"success": True, "data": CustomerResponse.model_validate(result).model_dump()}


@router.delete("/{customer_id}", response_model=dict)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer."""
    customer_service.delete_customer(db, customer_id)
    return {"success": True, "data": None}
@router.post("/import")
async def import_customers(
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
            email = str(row["email"]).strip()

            existing = (
                db.query(Customer)
                .filter(Customer.email == email)
                .first()
            )

            if existing:
                skipped += 1
                continue

            customer = Customer(
                full_name=str(row["full_name"]).strip(),
                email=email,
                phone=str(row["phone"]).strip(),
            )

            db.add(customer)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {index + 1}: {str(e)}")

    db.commit()

    return {
        "success": True,
        "data": {
            "imported": imported,
            "skipped": skipped,
            "errors": errors,
        },
    }
