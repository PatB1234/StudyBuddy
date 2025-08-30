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
    name: str
    email: str
    password: str


class EditUserModel(BaseModel):

    newName: str = ""
    email: str
    oldPassword: str
    newPassword: str = ""


class Notes(BaseModel):

    fileID: int
    fileName: str
    ownerEmail: str
    sectionName: str


class PostChangeNotes(BaseModel):

    newNoteName: str


class PostDeleteNoteModel(BaseModel):

    noteName: str


class GetExportModel(BaseModel):

    type: int = 2


class GenericException(Exception):

    pass
