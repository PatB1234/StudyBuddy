from fastapi import FastAPI, Request, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Form
from classes import *
from funcs import *
from fastapi.middleware.cors import CORSMiddleware
from db import *
import os, shutil
app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

origins = ['http://localhost:4200', 'http://45.79.253.48:4200', 'http://45.79.253.48:8000', 'http://45.79.253.25:4200', 'http://45.79.253.25:8000', 'https://studdybuddy.app/', 'http://studdybuddy.app/']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
def change_current_notes(newNoteName: classes.PostChangeNotes, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        db.changeCurrentNotes(request.headers.get('token'), newNoteName.newNoteName)


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

            # Check if the file size is ok (i.e. number of tokens)    
            if (check_token_no(file_path)): 

                addNotes(request.headers.get('token'), file.filename.replace(".pdf", ""), getLastNoteID() + 1, sectionName)
                return {"message": "Upload successful"}
            
            else:
                
                # Remove the file if it is too large
                if os.path.exists(file_path):

                    os.remove(file_path) 

                return {"message": "File is too large, please try with a different file or a non-handwritten file"}
        else:

            return {"message": "Incorrect filetype, must be PDF"}
        

@app.post("/get_all_user_notes_tree")
def get_user_notes_in_tree(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return getAllNotesTree(token_res[1])
    

@app.post("/get_currently_selected_note")
def getCurrentlySelectedNotesByToken(request: Request):
    
    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return getNoteByID(getCurrentNotesByToken(request.headers.get('token'))).fileName
    
@app.get("/api/cloud_check") # Cloud hoster calls this to ensure the server is responding
def cloud_check():

    return True