from pydantic import BaseModel, Field
from typing import Optional, List


class ReportCreate(BaseModel):
    location_id: Optional[str] = None
    location_name: str
    hazard_type: str
    description: str
    severity: str = "MODERATE"
    contact: Optional[str] = ""
    photo_provided: bool = False


class IncidentDispatch(BaseModel):
    note: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str


class ScenarioRequest(BaseModel):
    location_id: str
    rainfall_mm: float = Field(..., ge=0, le=400)
    soil_moisture_pct: float = Field(..., ge=0, le=100)


class ImageAssessmentResponse(BaseModel):
    indicators: List[str]
    potential_hazard: str
    confidence: int
    recommendation: str
    is_demo: bool = True
