from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    dynamodb_table_name: str = "funded-gr-dev"
    aws_region: str = "eu-central-1"
    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    github_token: str = ""
    cors_origin: str = "http://localhost:3000"
    dynamodb_endpoint_url: str = ""  # set to http://dynamodb-local:8000 in docker compose

    class Config:
        env_file = ".env"


settings = Settings()
