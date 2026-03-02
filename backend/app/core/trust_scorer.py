from app.models.validation import ValidationFlag, ErrorType, Severity


def calculate_trust_score(flags: list[ValidationFlag]) -> tuple[int, Severity]:
    """
    Trust Score formula:
      100 - (HARD_ERRORS × 30) - (SOFT_WARNINGS × 10) - (PLAUSIBLE_OUTLIERS × 3)
    Clamped to [0, 100].
    """
    hard = sum(1 for f in flags if f.type == ErrorType.HARD_ERROR)
    soft = sum(1 for f in flags if f.type == ErrorType.SOFT_WARNING)
    outlier = sum(1 for f in flags if f.type == ErrorType.PLAUSIBLE_OUTLIER)

    score = 100 - (hard * 30) - (soft * 10) - (outlier * 3)
    score = max(0, min(100, score))

    if score >= 70:
        severity = Severity.GREEN
    elif score >= 40:
        severity = Severity.YELLOW
    else:
        severity = Severity.RED

    return score, severity
