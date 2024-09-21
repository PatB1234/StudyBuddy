from fastapi import FastAPI
from fastapi import status, Form, Request
from fastapi.param_functions import Depends
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates
from starlette.responses import RedirectResponse
from ai import * 

app = FastAPI()
app.mount("/ui", StaticFiles(directory = "ui"), name = "ui")

responses = []

@app.get("/")
def get_home(request: Request):

    return RedirectResponse("/ui/index.html", status.HTTP_302_FOUND)   

@app.post("/")
def get_prompt(request: Request, prompt: str = Form(...)):

    responses.append(prompt)
    response = chat_session.send_message(prompt)
    responses.append(response.text)
    return RedirectResponse("/ui/index.html", status.HTTP_302_FOUND)   

@app.get("/messages")
def get_message_arr(request: Request):

    return responses
