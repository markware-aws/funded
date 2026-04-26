from datetime import datetime, timezone, timedelta
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.db import get_table
from app.keys import project_pk, PROJECT_SK, gsi4_score_sk, GSI4_PK, GSI4_SK
from app.models.evaluation import EvaluationResult, EvaluationRecord
from app.config import settings

SYSTEM_PROMPT = """You are an expert startup evaluator with deep knowledge of the Greek and European tech ecosystem.
You evaluate early-stage projects and startups for potential, originality, and acquisition readiness.
Return a structured JSON evaluation — no extra text."""

_agent: Agent[None, EvaluationResult] | None = None


def _get_agent() -> Agent[None, EvaluationResult]:
    global _agent
    if _agent is None:
        model = OpenAIModel(settings.openai_model, provider=OpenAIProvider(api_key=settings.openai_api_key))
        _agent = Agent(model, output_type=EvaluationResult, system_prompt=SYSTEM_PROMPT)
    return _agent


def _build_prompt(project: dict) -> str:
    return f"""Evaluate this project submission. Score each dimension 0–100.

Name: {project['name']}
Tagline: {project['tagline']}
Description: {project['description']}
Vision: {project['vision']}
Features: {', '.join(project.get('features', []))}
Website: {project.get('websiteUrl') or 'Not provided'}
GitHub: {project.get('githubUrl') or 'Not provided'}
GitHub Stars: {project.get('githubStars', 'N/A')}
Monthly Revenue: {project.get('monthlyRevenue') or 'Not disclosed'} (€)
Monthly Users: {project.get('monthlyUsers') or 'Not disclosed'}
Category: {project['category']}

DIMENSIONS:
1. problemClarity (20%) — clear problem, obvious target user
2. originality (20%) — differentiator, Greek/EU context
3. completenessDeployment (25%) — live site, active GitHub, deployed vs idea
4. commercialViability (20%) — monetization path, B2B preferred; if monthlyRevenue provided weight it heavily ("20k-50k"/"50k+" are very strong signals); use monthlyUsers to validate traction claims
5. presentationQuality (15%) — well-written, credible

totalScore = weighted average, rounded to nearest int.
readinessLabel: "idea" (<30 or no site/GitHub), "prototype" (30–54), "launched" (55–74 with site), "scalable" (≥75 with traction)"""


def handle(event: dict, context) -> None:
    project_id = event["projectId"]
    now = datetime.now(timezone.utc).isoformat()
    table = get_table()

    try:
        project = table.get_item(
            Key={"PK": project_pk(project_id), "SK": PROJECT_SK}
        ).get("Item")
        if not project:
            raise ValueError(f"Project {project_id} not found")

        import asyncio
        result = asyncio.run(_get_agent().run(_build_prompt(project)))
        evaluation_result: EvaluationResult = result.output

        record = EvaluationRecord(
            **evaluation_result.model_dump(),
            requestedAt=project["updatedAt"],
            completedAt=now,
        )

        locked_until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

        table.update_item(
            Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
            UpdateExpression=(
                "SET evaluationStatus = :s, evaluation = :e, updatedAt = :now,"
                " #gsi4pk = :g4pk, #gsi4sk = :g4sk, evaluationLockedUntil = :lock"
            ),
            ExpressionAttributeNames={"#gsi4pk": GSI4_PK, "#gsi4sk": GSI4_SK},
            ExpressionAttributeValues={
                ":s": "complete",
                ":e": record.model_dump(),
                ":now": now,
                ":g4pk": "PROJECT",
                ":g4sk": gsi4_score_sk(evaluation_result.totalScore),
                ":lock": locked_until,
            },
        )
    except Exception as e:
        print(f"Evaluation worker failed for {project_id}: {e}")
        table.update_item(
            Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
            UpdateExpression="SET evaluationStatus = :f, updatedAt = :now",
            ExpressionAttributeValues={":f": "failed", ":now": now},
        )
