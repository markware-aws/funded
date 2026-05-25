# DynamoDB primary key helpers

def user_pk(user_id: str) -> str:
    return f"USER#{user_id}"

def project_pk(project_id: str) -> str:
    return f"PROJECT#{project_id}"

def like_sk(user_id: str) -> str:
    return f"LIKE#{user_id}"

def liked_sk(project_id: str) -> str:
    return f"LIKED#{project_id}"

def saved_sk(project_id: str) -> str:
    return f"SAVED#{project_id}"

USER_SK = "PROFILE"
PROJECT_SK = "METADATA"

# GSI attribute names
GSI1_PK = "GSI1PK"
GSI1_SK = "GSI1SK"
GSI2_PK = "GSI2PK"
GSI2_SK = "GSI2SK"
GSI3_PK = "GSI3PK"
GSI3_SK = "GSI3SK"
GSI4_PK = "GSI4PK"
GSI4_SK = "GSI4SK"
GSI5_PK = "GSI5PK"
GSI5_SK = "GSI5SK"

# GSI index names
GSI_BY_LIKES = "GSI1-ByLikes"
GSI_BY_USER = "GSI2-ByUser"
GSI_BY_CATEGORY = "GSI3-ByCategory"
GSI_BY_SCORE = "GSI4-ByScore"
GSI_BY_REVIEW_STATUS = "GSI5-ByReviewStatus"

# GSI value helpers
def gsi1_project_pk() -> str:
    return "PROJECT"

def gsi1_likes_sk(like_count: int) -> str:
    return str(like_count).zfill(8)

def gsi2_user_pk(user_id: str) -> str:
    return f"USER#{user_id}"

def gsi3_category_pk(category: str) -> str:
    return f"CAT#{category}"

def gsi4_score_sk(score: int) -> str:
    return str(score).zfill(8)

def gsi5_review_pk(review_status: str) -> str:
    return f"REVIEW#{review_status}"

def slug_pk(slug: str) -> str:
    return f"SLUG#{slug}"

SLUG_SK = "SLUG"

def contact_pk(contact_id: str) -> str:
    return f"CONTACT#{contact_id}"

CONTACT_SK = "MESSAGE"

def admin_audit_pk(audit_id: str) -> str:
    return f"ADMIN_AUDIT#{audit_id}"

ADMIN_AUDIT_SK = "ACTION"
