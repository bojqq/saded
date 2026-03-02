import json
import logging
from typing import Any

from anthropic import AsyncAnthropic

from app.core.config import get_settings
from app.models.validation import ValidationFlag, ErrorType, SuggestedCorrection

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a statistical data quality expert for GASTAT (General Authority for Statistics of Saudi Arabia).
Your task is to detect semantic contradictions in Labour Force Survey (LFS) responses submitted by field surveyors.

Survey fields:
- age, gender, nationality, marital_status, region
- education_level: none | primary | intermediate | secondary | diploma | bachelor | postgraduate | doctorate
- employment_status: employed | unemployed | not_in_labor_force
- occupation (free text), work_sector: government | private | self_employed | non_profit
- weekly_work_hours (0-168), monthly_income_sar, years_of_experience

You MUST return ONLY valid JSON. No preamble, no explanation, no markdown fences.

Detect contradictions across ALL fields together — consider Saudi Arabia labour market norms.

Return this exact structure:
{
  "flags": [
    {
      "fields": ["field_name_1", "field_name_2"],
      "type": "HARD_ERROR" | "SOFT_WARNING" | "PLAUSIBLE_OUTLIER",
      "description_ar": "وصف التعارض باللغة العربية",
      "description_en": "Contradiction description in English",
      "suggested_correction": {
        "field": "field_to_correct",
        "value": <corrected_value>,
        "confidence": 0.0-1.0
      }
    }
  ]
}

Error type definitions:
- HARD_ERROR: Logically impossible (surgeon + primary education; age 21 + 18 years experience; unemployed + 42000 SAR income; 168 weekly hours)
- SOFT_WARNING: Statistically very unlikely in Saudi context (intermediate education + 18000 SAR/month private sector; 0 experience + senior role)
- PLAUSIBLE_OUTLIER: Unusual but explainable (high income self-employed with low education)

If no contradictions exist, return: {"flags": []}"""

FEW_SHOT = [
    {
        "role": "user",
        "content": json.dumps({
            "age": 21, "gender": "male", "nationality": "saudi",
            "marital_status": "single", "region": "riyadh",
            "education_level": "primary", "employment_status": "employed",
            "occupation": "Cardiac Surgeon", "work_sector": "private",
            "weekly_work_hours": 70, "monthly_income_sar": 2500, "years_of_experience": 18
        }, ensure_ascii=False)
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "flags": [
                {
                    "fields": ["occupation", "education_level"],
                    "type": "HARD_ERROR",
                    "description_ar": "تعارض: مهنة الجراح تستلزم شهادة دكتوراه في الطب على الأقل، لكن المستوى التعليمي المسجَّل (ابتدائي) يجعل هذا مستحيلاً.",
                    "description_en": "Contradiction: Cardiac Surgeon requires a medical doctorate; 'primary' education makes this impossible.",
                    "suggested_correction": {"field": "education_level", "value": "doctorate", "confidence": 0.97}
                },
                {
                    "fields": ["age", "years_of_experience"],
                    "type": "HARD_ERROR",
                    "description_ar": "تعارض: عمر 21 سنة مع 18 سنة خبرة يعني بدء العمل في عمر 3 سنوات — وهذا مستحيل.",
                    "description_en": "Contradiction: Age 21 with 18 years of experience implies starting work at age 3, which is impossible.",
                    "suggested_correction": {"field": "years_of_experience", "value": 1, "confidence": 0.93}
                },
                {
                    "fields": ["occupation", "monthly_income_sar"],
                    "type": "HARD_ERROR",
                    "description_ar": "تعارض: راتب الجراح في القطاع الخاص بالسعودية لا يقل عادةً عن 25,000 ريال، في حين المبلغ المسجَّل 2,500 ريال فقط.",
                    "description_en": "Contradiction: A private-sector surgeon in Saudi Arabia typically earns 25,000+ SAR/month; 2,500 SAR is implausibly low.",
                    "suggested_correction": {"field": "monthly_income_sar", "value": 28000, "confidence": 0.88}
                }
            ]
        })
    },
    {
        "role": "user",
        "content": json.dumps({
            "age": 29, "gender": "female", "nationality": "saudi",
            "marital_status": "married", "region": "jeddah",
            "education_level": "bachelor", "employment_status": "unemployed",
            "occupation": "None", "work_sector": "government",
            "weekly_work_hours": 0, "monthly_income_sar": 42000, "years_of_experience": 0
        }, ensure_ascii=False)
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "flags": [
                {
                    "fields": ["employment_status", "monthly_income_sar"],
                    "type": "HARD_ERROR",
                    "description_ar": "تعارض: المستجيب مسجَّل كعاطل عن العمل لكنه يُبلّغ عن دخل شهري قدره 42,000 ريال. هذا يتناقض مع وضع العمل المسجَّل.",
                    "description_en": "Contradiction: Respondent is registered as unemployed yet reports a monthly income of 42,000 SAR. This is inconsistent with unemployment status.",
                    "suggested_correction": {"field": "employment_status", "value": "employed", "confidence": 0.91}
                },
                {
                    "fields": ["employment_status", "weekly_work_hours"],
                    "type": "SOFT_WARNING",
                    "description_ar": "تحذير: المستجيب عاطل لكنه مسجَّل في القطاع الحكومي مع صفر ساعات عمل أسبوعياً.",
                    "description_en": "Warning: Unemployed respondent is listed under Government sector with zero weekly work hours.",
                    "suggested_correction": {"field": "work_sector", "value": "none", "confidence": 0.78}
                }
            ]
        })
    },
    {
        "role": "user",
        "content": json.dumps({
            "age": 34, "gender": "male", "nationality": "saudi",
            "marital_status": "married", "region": "riyadh",
            "education_level": "bachelor", "employment_status": "employed",
            "occupation": "Civil Engineer", "work_sector": "government",
            "weekly_work_hours": 40, "monthly_income_sar": 13500, "years_of_experience": 9
        }, ensure_ascii=False)
    },
    {
        "role": "assistant",
        "content": '{"flags": []}'
    }
]


async def run_validation(fields: dict[str, Any]) -> list[ValidationFlag]:
    settings = get_settings()
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    messages = FEW_SHOT + [
        {"role": "user", "content": f"Validate: {json.dumps(fields, ensure_ascii=False)}"}
    ]

    for attempt in range(2):
        try:
            response = await client.messages.create(
                model=settings.claude_model,
                max_tokens=settings.max_tokens,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
            raw = response.content[0].text.strip()
            data = json.loads(raw)
            flags = []
            for f in data.get("flags", []):
                correction = None
                if f.get("suggested_correction"):
                    correction = SuggestedCorrection(**f["suggested_correction"])
                flags.append(ValidationFlag(
                    fields=f["fields"],
                    type=ErrorType(f["type"]),
                    description_ar=f["description_ar"],
                    description_en=f["description_en"],
                    suggested_correction=correction,
                ))
            return flags
        except json.JSONDecodeError as e:
            logger.warning(f"LLM JSON parse failed (attempt {attempt + 1}): {e}")
            if attempt == 1:
                return []
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return []

    return []
