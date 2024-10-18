from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status, Form
from fastapi.param_functions import Depends
from pydantic import BaseModel
from funcs import *
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

origins = ['null']

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Prompt(BaseModel):

    customPrompt: str
    
@app.post("/custom_prompt")
def post_custom_prompt(prompt: Prompt):
    print(custom_prompt(prompt.customPrompt))
