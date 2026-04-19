import httpx
from datetime import datetime, timezone
from app.db import get_table
from app.keys import project_pk, PROJECT_SK
from app.config import settings


def handle(event: dict, context) -> None:
    table = get_table()
    res = table.scan(
        FilterExpression="SK = :meta AND attribute_exists(githubUrl)",
        ExpressionAttributeValues={":meta": PROJECT_SK},
        ProjectionExpression="projectId, githubUrl",
    )
    projects = res.get("Items", [])
    print(f"Refreshing GitHub stars for {len(projects)} projects")

    for p in projects:
        github_url = p.get("githubUrl", "")
        import re
        match = re.search(r"github\.com/([^/]+/[^/]+)", github_url)
        if not match:
            continue
        repo = match.group(1).rstrip("/")
        try:
            with httpx.Client() as client:
                r = client.get(
                    f"https://api.github.com/repos/{repo}",
                    headers={"Authorization": f"Bearer {settings.github_token}", "User-Agent": "funded-gr-bot"},
                    timeout=10,
                )
                if not r.is_success:
                    continue
                data = r.json()
            table.update_item(
                Key={"PK": project_pk(p["projectId"]), "SK": PROJECT_SK},
                UpdateExpression="SET githubStars = :s, githubLastUpdated = :u",
                ExpressionAttributeValues={":s": data["stargazers_count"], ":u": data["pushed_at"]},
            )
        except Exception as e:
            print(f"Failed to refresh {repo}: {e}")
