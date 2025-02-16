from pydantic import BaseModel


class PostCustomPromptModel(BaseModel):

    customPrompt: str


class PostCheckAnswersModel(BaseModel):

    question: str = ""
    answer: str = ""

class PostStudentModel(BaseModel):

    name: str
    email: str
    password: str

class PostLoginCheckStudentModel(BaseModel):

    email: str
    password: str

class editUserModel(BaseModel):
    
    newName: str = ""
    email: str 
    oldPassword: str
    newPassword: str = ""