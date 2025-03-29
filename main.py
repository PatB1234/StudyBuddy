from fastapi import FastAPI, Request, Response, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status, Form
from fastapi.param_functions import Depends
from classes import *
from funcs import *
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from db import *
import os, shutil
app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

origins = ['null']
path = 'http://localhost:4200'
app.add_middleware(
    CORSMiddleware,
    allow_origins=[path],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''
Token Validation is standardised accross the functions. If a token is valid, the function will return data as normal. If not, a False is returned by the token validator, resulting in a 401 error in the frontend
'''

@app.post("/custom_prompt")
def post_custom_prompt(prompt: PostCustomPromptModel, request: Request):
        
    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return custom_prompt(prompt.customPrompt, db.getCurrentNotesByToken(request.headers.get('token')))


@app.get("/summarise")
def post_summarise(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return summariser(db.getCurrentNotesByToken(request.headers.get('token')))

@app.get("/get_questions")
def get_questions(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return make_questions(db.getCurrentNotesByToken(request.headers.get('token')))

@app.post("/check_question")
def post_check_questions(res: PostCheckAnswersModel, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return check_question(res.question, res.answer, db.getCurrentNotesByToken(request.headers.get('token')))

@app.get("/get_flashcards")
def get_flashcards(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return flashcards(db.getCurrentNotesByToken(request.headers.get('token'))) 


@app.post("/create_student")
def create_user_post(user: PostStudentModel):

    return create_user(Student(name=user.name, email=user.email, password=user.password))

@app.post("/check_student_login")
def check_student_login_post(user: PostLoginCheckStudentModel):


    return check_student_login(user.email, user.password)

@app.get("/get_student_credentials")
def get_student_by_token(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        name, email, id = token_res  # Unpack the validated data
        return {"name": name, "email": email, "id": id}
    
@app.post("/edit_user")
def edit_user(newDetails: editUserModel, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        
        return editUser(newDetails.newName, newDetails.email, newDetails.oldPassword, newDetails.newPassword)
    

@app.post("/change_current_notes")
def change_current_notes(newID: classes.PostChangeNotes, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        db.changeCurrentNotes(request.headers.get('token'), newID.newFileID)


@app.post("/add_notes")
def post_add_notes(request: Request, sectionName: str = Form(...), file: UploadFile = File(...), ):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        
        if '.pdf' in file.filename:


            file_path = os.path.join("Data", str(getLastNoteID() + 1) + ".pdf")
            with open(file_path, "wb") as buff:

                shutil.copyfileobj(file.file, buff)
            addNotes(request.headers.get('token'), file.filename, getLastNoteID() + 1, sectionName)
            return {"message": "Upload successful"}
        else:

            return {"message": "Incorrect filetype, must be PDF"}
        

@app.post("/get_all_user_notes_tree")
def get_user_notes_in_tree(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        print(getAllNotesTree(token_res[1]))
        return getAllNotesTree(token_res[1])