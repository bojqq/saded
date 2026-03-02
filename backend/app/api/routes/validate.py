import time
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter

from app.core import cache, llm_engine
from app.core.trust_scorer import calculate_trust_score
from app.core.supabase_client import get_supabase
from app.models.validation import (
    SurveyValidationRequest,
    SurveyValidationResponse,
    ErrorType,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/validate", response_model=SurveyValidationResponse)
async def validate_survey(request: SurveyValidationRequest):
    start = time.monotonic()

    # Check cache first
    cached = await cache.get_cached(request.fields)
    if cached:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return SurveyValidationResponse(
            survey_id=request.survey_id,
            processing_time_ms=elapsed_ms,
            **cached,
        )

    # Run LLM validation
    flags = await llm_engine.run_validation(request.fields)
    trust_score, severity = calculate_trust_score(flags)

    # Determine top-level classification
    classification = None
    if any(f.type == ErrorType.HARD_ERROR for f in flags):
        classification = ErrorType.HARD_ERROR
    elif any(f.type == ErrorType.SOFT_WARNING for f in flags):
        classification = ErrorType.SOFT_WARNING
    elif any(f.type == ErrorType.PLAUSIBLE_OUTLIER for f in flags):
        classification = ErrorType.PLAUSIBLE_OUTLIER

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Persist to Supabase via REST API
    sb = get_supabase()
    sb.table("survey_records").insert({
        "id": str(uuid.uuid4()),
        "survey_id": request.survey_id,
        "respondent_id": request.respondent_id,
        "fields": request.fields,
        "trust_score": trust_score,
        "severity": severity.value,
        "flags": [f.model_dump() for f in flags],
        "classification": classification.value if classification else None,
        "processing_time_ms": elapsed_ms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    # Cache result
    result_dict = {
        "trust_score": trust_score,
        "severity": severity.value,
        "flags": [f.model_dump() for f in flags],
        "classification": classification.value if classification else None,
    }
    await cache.set_cached(request.fields, result_dict)

    return SurveyValidationResponse(
        survey_id=request.survey_id,
        trust_score=trust_score,
        severity=severity,
        flags=flags,
        classification=classification,
        processing_time_ms=elapsed_ms,
    )
