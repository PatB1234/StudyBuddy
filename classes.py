from pydantic import BaseModel


class PostCustomPromptModel(BaseModel):

    customPrompt: str


class PostCheckAnswersModel(BaseModel):

    question: str
    answer: str