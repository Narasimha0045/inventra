from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.schemas import DashboardSummary
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=dict)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary with KPIs and activity feed."""
    result = dashboard_service.get_dashboard_summary(db)
    summary = DashboardSummary.model_validate(result)
    return {"success": True, "data": summary.model_dump()}
