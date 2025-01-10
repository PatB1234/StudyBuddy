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
    
@app.post("/custom_prompt")
def post_custom_prompt(prompt: PostCustomPromptModel):
    return custom_prompt(prompt.customPrompt)


@app.get("/summarise")
def post_summarise():

    return summariser()

@app.get("/get_questions")
def get_questions():

    return make_questions()

@app.post("/check_question")
def post_check_questions(res: PostCheckAnswersModel):

    return check_question(res.question, res.answer)

@app.get("/get_flashcards")
def get_flashcards():

    return flashcards() 


@app.post("/create_student")
def create_user_post(user: PostStudentModel):

    return create_user(Student(name=user.name, email=user.email, password=user.password))

@app.post("/check_student_login")
def check_student_login_post(user: PostStudentModel):

    return check_student_login(user.name, user.email, user.password)