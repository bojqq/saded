from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class SurveyRecord(Base):
    __tablename__ = "survey_records"

    id = Column(String, primary_key=True)
    survey_id = Column(String, nullable=False, index=True)
    respondent_id = Column(String, nullable=False)
    fields = Column(JSON, nullable=False)
    trust_score = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)
    flags = Column(JSON, nullable=False, default=list)
    classification = Column(String, nullable=True)
    processing_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ValidationAuditLog(Base):
    __tablename__ = "validation_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_record_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # SUBMITTED, CORRECTED, ACCEPTED, REJECTED
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
