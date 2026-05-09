"""AI Action Presets HTTP routes.

POST /tools/run  — รับ tool kind + user input → return Markdown output
                   (synchronous; tools complete in 5-15s)
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..main import require_worker_secret
from ..services.claude.tools_run import (
    ToolError,
    run_tool,
)

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolRunRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id")
    tool: str = Field(..., description="hook_doctor | grade_draft | niche_playbook")
    input: str = Field(..., min_length=1, max_length=8000)


class ToolRunResponse(BaseModel):
    output_markdown: str
    meta: dict


@router.post("/run", response_model=ToolRunResponse)
def post_tool_run(
    body: ToolRunRequest,
    authorization: str | None = Header(default=None),
) -> ToolRunResponse:
    require_worker_secret(authorization)

    if body.tool not in {"hook_doctor", "grade_draft", "niche_playbook"}:
        raise HTTPException(
            status_code=400, detail=f"unknown tool: {body.tool}"
        )

    try:
        result = run_tool(body.tool, body.input)  # type: ignore[arg-type]
    except ToolError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"anthropic error: {exc}"
        ) from exc

    return ToolRunResponse(
        output_markdown=result.output_markdown,
        meta=result.meta.to_jsonable(),
    )
