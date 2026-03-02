import logging
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter

from app.core.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard/metrics")
def get_dashboard_metrics():
    sb = get_supabase()
    result = sb.table("survey_records").select("*").execute()
    records = result.data or []

    total = len(records)

    # Severity distribution
    severity_dist: dict[str, int] = defaultdict(int)
    for r in records:
        severity_dist[r["severity"]] += 1

    # Average trust score
    avg_score = round(sum(r["trust_score"] for r in records) / max(total, 1), 1)

    # Trust score histogram (buckets: 0-19, 20-39, 40-59, 60-79, 80-100)
    buckets = {"0-19": 0, "20-39": 0, "40-59": 0, "60-79": 0, "80-100": 0}
    for r in records:
        s = r["trust_score"]
        if s < 20:
            buckets["0-19"] += 1
        elif s < 40:
            buckets["20-39"] += 1
        elif s < 60:
            buckets["40-59"] += 1
        elif s < 80:
            buckets["60-79"] += 1
        else:
            buckets["80-100"] += 1
    trust_histogram = [{"bucket": k, "count": v} for k, v in buckets.items()]

    # Daily submission trend (last 7 days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    day_data: dict[str, dict] = defaultdict(lambda: {"total": 0, "red": 0, "yellow": 0, "green": 0})
    for r in records:
        raw_ts = r.get("created_at", "")
        if raw_ts:
            dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            if dt >= cutoff:
                day = dt.date().isoformat()
                day_data[day]["total"] += 1
                day_data[day][r["severity"].lower()] += 1
    daily_trend = [{"day": day, **data} for day, data in sorted(day_data.items())]

    # Field-level error frequency
    field_counts: dict[str, int] = defaultdict(int)
    for r in records:
        for flag in (r.get("flags") or []):
            for field in flag.get("fields", []):
                field_counts[field] += 1
    field_error_frequency = sorted(
        [{"field": f, "count": c} for f, c in field_counts.items()],
        key=lambda x: -x["count"],
    )[:10]

    # Recent 20 submissions
    recent = sorted(records, key=lambda x: x.get("created_at", ""), reverse=True)[:20]

    return {
        "total_submissions": total,
        "severity_distribution": {
            "GREEN": severity_dist.get("GREEN", 0),
            "YELLOW": severity_dist.get("YELLOW", 0),
            "RED": severity_dist.get("RED", 0),
        },
        "average_trust_score": avg_score,
        "trust_histogram": trust_histogram,
        "daily_trend": daily_trend,
        "field_error_frequency": field_error_frequency,
        "recent_submissions": [
            {
                "id": r["id"],
                "survey_id": r["survey_id"],
                "respondent_id": r["respondent_id"],
                "trust_score": r["trust_score"],
                "severity": r["severity"],
                "classification": r.get("classification"),
                "processing_time_ms": r["processing_time_ms"],
                "created_at": r.get("created_at"),
            }
            for r in recent
        ],
    }
