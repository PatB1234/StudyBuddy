from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status, Form
from fastapi.param_functions import Depends
from pydantic import BaseModel
from funcs import *

app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

@app.post("/custom_prompt")
def post_custom_prompt(prompt: str = Form(...)):

    return custom_prompt(prompt)
