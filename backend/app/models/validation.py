from pydantic import BaseModel, Field
from typing import Any
from enum import Enum


class Severity(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"


class ErrorType(str, Enum):
    HARD_ERROR = "HARD_ERROR"
    SOFT_WARNING = "SOFT_WARNING"
    PLAUSIBLE_OUTLIER = "PLAUSIBLE_OUTLIER"


class SuggestedCorrection(BaseModel):
    field: str
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)


class ValidationFlag(BaseModel):
    fields: list[str]
    type: ErrorType
    description_ar: str
    description_en: str
    suggested_correction: SuggestedCorrection | None = None


class SurveyValidationRequest(BaseModel):
    survey_id: str
    respondent_id: str
    fields: dict[str, Any]


class SurveyValidationResponse(BaseModel):
    survey_id: str
    trust_score: int = Field(ge=0, le=100)
    severity: Severity
    flags: list[ValidationFlag]
    classification: ErrorType | None = None
    processing_time_ms: int


class WebSocketMessage(BaseModel):
    field: str
    value: Any
    context: dict[str, Any] = {}
