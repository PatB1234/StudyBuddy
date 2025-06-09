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

origins = ['http://localhost:4200', 'http://localhost:3001', 'http://45.79.253.48:3001', 'http://45.79.253.48:3000', 'http://localhost:3000', 'http://45.79.253.48:4200', 'http://45.79.253.48:8000', 'http://45.79.253.25:4200', 'http://45.79.253.25:8000', 'https://studdybuddy.app/', 'http://studdybuddy.app/']

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

@app.post("/api/custom_prompt")
async def post_custom_prompt(prompt: PostCustomPromptModel, request: Request):
        
    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return custom_prompt(prompt.customPrompt, db.getCurrentNotesByToken(request.headers.get('token')))


@app.get("/api/summarise")
async def post_summarise(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return summariser(db.getCurrentNotesByToken(request.headers.get('token')))

@app.get("/api/get_questions")
async def get_questions(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return make_questions(db.getCurrentNotesByToken(request.headers.get('token')))

@app.post("/api/check_question")
async def post_check_questions(res: PostCheckAnswersModel, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return check_question(res.question, res.answer, db.getCurrentNotesByToken(request.headers.get('token')))

@app.get("/api/get_flashcards")
async def get_flashcards(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        return flashcards(db.getCurrentNotesByToken(request.headers.get('token'))) 


@app.post("/api/create_student")
async def create_user_post(user: PostStudentModel):

    return create_user(Student(name=user.name, email=user.email, password=user.password))

@app.post("/api/check_student_login")
async def check_student_login_post(user: PostLoginCheckStudentModel):

    return check_student_login(user.email, user.password)

@app.get("/api/get_student_credentials")
async def get_student_by_token(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        name, email, id = token_res  # Unpack the validated data
        return {"name": name, "email": email, "id": id}
    
@app.post("/api/edit_user")
async def edit_user(newDetails: editUserModel, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        
        return editUser(newDetails.newName, newDetails.email, newDetails.oldPassword, newDetails.newPassword)
    

@app.post("/api/change_current_notes")
async def change_current_notes(newNoteName: classes.PostChangeNotes, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        db.changeCurrentNotes(request.headers.get('token'), newNoteName.newNoteName)


@app.post("/api/add_notes")
async def post_add_notes(request: Request, sectionName: str = Form(...), file: UploadFile = File(...), ):

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
        

@app.post("/api/get_all_user_notes_tree")
async def get_user_notes_in_tree(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return getAllNotesTree(token_res[1])
    

@app.post("/api/get_currently_selected_note")
async def getCurrentlySelectedNotesByToken(request: Request):
    
    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return getNoteByID(getCurrentNotesByToken(request.headers.get('token'))).fileName
    
@app.get("/api/cloud_check") # Cloud hoster calls this to ensure the server is responding
async def cloud_check():

    return True

@app.post("/api/delete_user")
async def post_delete_user(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return delete_user_id(token_res[2])  
    

@app.post("/api/delete_note_by_name")
async def post_delete_note_by_name(noteName: PostDeleteNoteModel, request: Request):
    
    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        return deleteNoteByName(noteName.noteName, request.headers.get('token'))