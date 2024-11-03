from pydantic import BaseModel


class PostCustomPromptModel(BaseModel):

    customPrompt: str


