from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status, Form
from fastapi.param_functions import Depends
from classes import *
from funcs import *
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from db import *
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
        return custom_prompt(prompt.customPrompt)


@app.get("/summarise")
def post_summarise(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return summariser()

@app.get("/get_questions")
def get_questions(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return make_questions()

@app.post("/check_question")
def post_check_questions(res: PostCheckAnswersModel, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return check_question(res.question, res.answer)

@app.get("/get_flashcards")
def get_flashcards(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return flashcards() 


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