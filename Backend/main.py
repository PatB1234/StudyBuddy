from fastapi import FastAPI, Request, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Form
from classes import *
from funcs import *
from fastapi.middleware.cors import CORSMiddleware
from db import *
import os
import shutil
import pandas as pd
app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

origins = ['http://localhost:4200', 'http://localhost:3001', 'http://45.79.253.48:3001', 'http://45.79.253.48:3000', 'http://localhost:3000',
           'http://45.79.253.48:4200', 'http://45.79.253.48:8000', 'http://45.79.253.25:4200', 'http://45.79.253.25:8000', 'https://studdybuddy.app/', 'http://studdybuddy.app/']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
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

    students = get_all_students()
    found = False
    for stu in students:

        if stu.email == user.email:

            found = True
            # Account has been found with this email, check the password
            return check_student_login(user.email, user.password)

    if (not found):

        return create_student_with_token(Student(name=user.name, email=user.email, password=user.password))


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

        db.changeCurrentNotes(request.headers.get(
            'token'), newNoteName.newNoteName)


@app.post("/api/add_notes")
async def post_add_notes(request: Request, sectionName: str = Form(...), file: UploadFile = File(...), handwritten: str = Form(...)):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:
        isHandwritten = int(handwritten)
        if '.pdf' in file.filename:

            if (isHandwritten == 1):

                fileID = getLastNoteID() + 1
                file_path = os.path.join("Data", str(fileID) + ".pdf")

                with open(file_path, "wb") as buff:
                    shutil.copyfileobj(file.file, buff)

                res = convert_handwritten_to_pdf(file_path, int(fileID))

                if (check_token_no(file_path)):

                    addNotes(request.headers.get('token'), file.filename.replace(
                        ".pdf", ""), getLastNoteID() + 1, sectionName)
                    return {"message": "Upload successful" + res}

                else:

                    # Remove the file if it is too large
                    if os.path.exists(file_path):

                        os.remove(file_path)

                    return {"message": "File is too large, please try with a different file or a select the handwritten flag if your pdf is a handwritten note"}
            else:

                file_path = os.path.join(
                    "Data", str(getLastNoteID() + 1) + ".pdf")
                with open(file_path, "wb") as buff:

                    shutil.copyfileobj(file.file, buff)

                # Check if the file size is ok (i.e. number of tokens)
                if (check_token_no(file_path)):

                    addNotes(request.headers.get('token'), file.filename.replace(
                        ".pdf", ""), getLastNoteID() + 1, sectionName)
                    return {"message": "Upload successful"}

                else:

                    # Remove the file if it is too large
                    if os.path.exists(file_path):

                        os.remove(file_path)

                    return {"message": "File is too large, please try with a different file or a non-handwritten file"}
        # If the notes are of a PNG type, they are automatically processed as handwritten notes
        elif ('.png' in file.filename) or ('.PNG' in file.filename):

            fileID = getLastNoteID() + 1
            file_path = os.path.join("Data", str(fileID) + ".png")

            with open(file_path, "wb") as buff:
                shutil.copyfileobj(file.file, buff)

            res = convert_handwritten_to_pdf(file_path, int(fileID))
            addNotes(request.headers.get('token'), file.filename.replace(
                ".png", ""), getLastNoteID() + 1, sectionName)
            return {"message": "Upload successful" + res}

        # If the notes are of a JPG type, they are automatically processed as handwritten notes
        elif ('.JPG' in file.filename) or ('.jpg' in file.filename):

            fileID = getLastNoteID() + 1
            file_path = os.path.join("Data", str(fileID) + ".jpg")

            with open(file_path, "wb") as buff:
                shutil.copyfileobj(file.file, buff)

            res = convert_handwritten_to_pdf(file_path, int(fileID))
            addNotes(request.headers.get('token'), file.filename.replace(
                ".jpg", ""), getLastNoteID() + 1, sectionName)
            return {"message": "Upload successful" + res}
        # If they are neither PDF, JPG nor PNG, they are rejected
        else:

            return {"message": "Incorrect filetype, must be PDF or JPG/PNG For handwritten content"}


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


# Cloud hoster calls this to ensure the server is responding
@app.get("/api/cloud_check")
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


@app.get("/api/export_flashcards/{resType}")
async def get_export_flashcards(resType: int, request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        if resType == 1:
            return return_flashcard_exported_format(getCurrentNotesByToken(request.headers.get('token')), resType)
        else:
            stud_name = validate_student(
                request.headers.get('token'))[1]

            res = return_flashcard_exported_format(getCurrentNotesByToken(
                request.headers.get('token')), resType)

            pd.DataFrame(res).to_csv(f'{stud_name}.csv', index=False)
            return FileResponse(path=f"{stud_name}.csv", media_type="text/csv", filename=f'{stud_name}.csv')


# Function to delete the flashcards after the user has downloaded them
@app.get("/api/delete_flashcard_request")
async def get_delete_flashcard(request: Request):

    token_res = validate_student(request.headers.get('token'))
    if token_res == False:

        return JSONResponse(status_code=401, content={"message": "Invalid token"})
    else:

        email = validate_student(request.headers.get('token'))[1]
        if os.path.exists(f"{email}.csv"):

            try:

                os.remove(f"{email}.csv")
                return True
            except:

                return False
        else:

            return False
