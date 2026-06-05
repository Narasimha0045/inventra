from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status , UploadFile
import pandas as pd
from app.models.models import Customer
from app.schemas.schemas import CustomerCreate
from typing import List, Optional


def create_customer(db: Session, customer_data: CustomerCreate) -> Customer:
    """Create a new customer. Raises 409 if email already exists."""
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_data.email}' already exists"
        )
    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_data.email}' already exists"
        )
    return customer


def get_customers(db: Session, search: Optional[str] = None) -> List[Customer]:
    """Retrieve all customers, optionally filtered by search term."""
    query = db.query(Customer)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(search_term)) |
            (Customer.email.ilike(search_term))
        )
    return query.order_by(Customer.created_at.desc()).all()


def get_customer(db: Session, customer_id: int) -> Customer:
    """Get a single customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    """Delete a customer and cascade to orders."""
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()

def import_customers(
    db: Session,
    file: UploadFile
):
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
            errors.append(
                f"Row {index + 1}: {str(e)}"
            )

    db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
    }