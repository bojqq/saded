import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core import llm_engine
from app.core.trust_scorer import calculate_trust_score

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/validate")
async def ws_validate(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                context: dict = msg.get("context", {})
                field = msg.get("field")
                value = msg.get("value")
                if field:
                    context[field] = value

                flags = await llm_engine.run_validation(context)
                trust_score, severity = calculate_trust_score(flags)

                await websocket.send_text(json.dumps({
                    "trust_score": trust_score,
                    "severity": severity.value,
                    "flags": [f.model_dump() for f in flags],
                }, ensure_ascii=False))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
