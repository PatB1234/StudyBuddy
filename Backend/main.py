"""
Token Validation is standardised accross the functions.
If a token is valid, the function will return data as normal.
If not, a False is returned by the token validator, resulting in a 401 error in the frontend
"""

import functools
import os
import anyio
import shutil

import pandas as pd
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import classes
import db
import funcs

app = FastAPI()
app.mount("/static", StaticFiles(directory="/"), name="static")

# Serialises note-ID allocation so concurrent uploads can't collide
UPLOAD_LOCK = anyio.Lock()

TOKEN_MESSAGE = "Invalid token"
UPLOAD_SUCCSESFUL = "Upload successful"

origins = [
    "http://localhost:4200",
    "http://34.88.99.24:4200",
    "http://34.88.99.24:8000",
    "https://studdybuddy.app/",
    "http://studdybuddy.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.post("/api/custom_prompt")
async def post_custom_prompt(prompt: classes.PostCustomPromptModel, request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return await anyio.to_thread.run_sync(
        funcs.custom_prompt,
        prompt.customPrompt,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.get("/api/summarise")
async def post_summarise(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return await anyio.to_thread.run_sync(
        funcs.summariser,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.get("/api/get_questions")
async def get_questions(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return await anyio.to_thread.run_sync(
        funcs.make_questions,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.post("/api/check_question")
async def post_check_questions(res: classes.PostCheckAnswersModel, request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return await anyio.to_thread.run_sync(
        funcs.check_question,
        res.question,
        res.answer,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.get("/api/get_flashcards")
async def get_flashcards(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    return await anyio.to_thread.run_sync(
        funcs.flashcards,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.get("/api/regenerate_flashcards")
async def get_regenerate_flashcards(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return await anyio.to_thread.run_sync(
        funcs.regenerate_flashcards,
        db.get_current_notes_by_token(request.headers.get("token")),
    )


@app.post("/api/create_student")
async def create_user_post(user: classes.PostStudentModel):

    return db.create_user(
        db.Student(name=user.name, email=user.email, password=user.password)
    )


@app.post("/api/check_student_login")
async def check_student_login_post(user: classes.PostLoginCheckStudentModel):

    students = db.get_all_students()
    found = False
    for stu in students:

        if stu.email == user.email:

            found = True
            # Account has been found with this email, check the password
            return db.check_student_login(user.email, user.password)

    if not found:

        return db.create_student_with_token(
            db.Student(name=user.name, email=user.email,
                       password=user.password)
        )


@app.get("/api/get_student_credentials")
async def get_student_by_token(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    name, email, uid = token_res  # Unpack the validated data
    return {"name": name, "email": email, "id": uid}


@app.post("/api/edit_user")
async def edit_user(new_details: classes.EditUserModel, request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    return db.edit_user(
        new_details.newName,
        new_details.email,
        new_details.oldPassword,
        new_details.newPassword,
    )


@app.post("/api/change_current_notes")
async def change_current_notes(
    new_note_name: classes.PostChangeNotes, request: Request
):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    db.change_current_notes(request.headers.get(
        "token"), new_note_name.newNoteName)


@app.post("/api/add_notes")
async def post_add_notes(
    request: Request,
    section_name: str = Form(...),
    file: UploadFile = File(...),
    handwritten: str = Form(...),
):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    is_handwritten = int(handwritten)

    def write_upload(dest_path: str) -> None:
        with open(dest_path, "wb") as buff:
            shutil.copyfileobj(file.file, buff)

    async with UPLOAD_LOCK:

        if ".pdf" in file.filename:

            if is_handwritten == 1:

                file_id = db.get_last_note_id() + 1
                file_path = os.path.join("Data", str(file_id) + ".pdf")

                await anyio.to_thread.run_sync(write_upload, file_path)

                res = await anyio.to_thread.run_sync(
                    funcs.convert_handwritten_to_pdf, file_path, int(file_id)
                )

                if await anyio.to_thread.run_sync(funcs.check_token_no, file_path):

                    db.add_notes(
                        request.headers.get("token"),
                        file.filename.replace(".pdf", ""),
                        file_id,
                        section_name,
                    )
                    return {"message": UPLOAD_SUCCSESFUL + res}

                # Remove the file if it is too large
                if os.path.exists(file_path):

                    os.remove(file_path)

                return {
                    "message": "File is too large, please try with a different file "
                    + "or a select the handwritten flag if your pdf is a handwritten note"
                }

            file_id = db.get_last_note_id() + 1
            file_path = os.path.join("Data", str(file_id) + ".pdf")
            await anyio.to_thread.run_sync(write_upload, file_path)

            # Check if the file size is ok (i.e. number of tokens)
            if await anyio.to_thread.run_sync(funcs.check_token_no, file_path):

                db.add_notes(
                    request.headers.get("token"),
                    file.filename.replace(".pdf", ""),
                    file_id,
                    section_name,
                )
                return {"message": UPLOAD_SUCCSESFUL}

            # Remove the file if it is too large
            if os.path.exists(file_path):

                os.remove(file_path)

            return {
                "message": "File is too large, please "
                + "try with a different file or a non-handwritten file"
            }
        # If the notes are of a PNG type, they are automatically processed as handwritten notes
        elif (".png" in file.filename) or (".PNG" in file.filename):

            file_id = db.get_last_note_id() + 1
            file_path = os.path.join("Data", str(file_id) + ".png")

            await anyio.to_thread.run_sync(write_upload, file_path)

            res = await anyio.to_thread.run_sync(
                funcs.convert_handwritten_to_pdf, file_path, int(file_id)
            )
            db.add_notes(
                request.headers.get("token"),
                file.filename.replace(".png", ""),
                file_id,
                section_name,
            )
            return {"message": UPLOAD_SUCCSESFUL + res}

        # If the notes are of a JPG type, they are automatically processed as handwritten notes
        elif (".JPG" in file.filename) or (".jpg" in file.filename):

            file_id = db.get_last_note_id() + 1
            file_path = os.path.join("Data", str(file_id) + ".jpg")

            await anyio.to_thread.run_sync(write_upload, file_path)

            res = await anyio.to_thread.run_sync(
                funcs.convert_handwritten_to_pdf, file_path, int(file_id)
            )
            db.add_notes(
                request.headers.get("token"),
                file.filename.replace(".jpg", ""),
                file_id,
                section_name,
            )
            return {"message": UPLOAD_SUCCSESFUL + res}
        # If they are neither PDF, JPG nor PNG, they are rejected

        return {
            "message": "Incorrect filetype, must be PDF or JPG/PNG For handwritten content"
        }


@app.post("/api/get_all_user_notes_tree")
async def get_user_notes_in_tree(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return db.get_all_notes_tree(token_res[1])

# Get the currently selected notes to ensure synchronisation with the frontend and backend


@app.post("/api/get_currently_selected_note")
async def get_currently_selected_notes_by_token(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    return db.get_note_by_id(
        db.get_current_notes_by_token(request.headers.get("token"))
    ).fileName


# Cloud hoster calls this to ensure the server is responding
@app.get("/api/cloud_check")
async def cloud_check():

    return True


@app.post("/api/delete_user")
async def post_delete_user(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    db.reset_selected_note_by_token(request.headers.get("token"))
    return db.delete_user_id(token_res[2])


@app.post("/api/delete_note_by_name")
async def post_delete_note_by_name(
    note_name: classes.PostDeleteNoteModel, request: Request
):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    db.reset_selected_note_by_token(request.headers.get("token"))
    return db.delete_note_by_name(note_name.noteName, request.headers.get("token"))


@app.get("/api/export_flashcards/{res_type}")
async def get_export_flashcards(res_type: int, request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    if res_type == 1:
        return await anyio.to_thread.run_sync(
            funcs.return_flashcard_exported_format,
            db.get_current_notes_by_token(request.headers.get("token")),
            res_type,
        )
    stud_name = db.validate_student(request.headers.get("token"))[1]

    res = await anyio.to_thread.run_sync(
        funcs.return_flashcard_exported_format,
        db.get_current_notes_by_token(request.headers.get("token")),
        res_type,
    )

    await anyio.to_thread.run_sync(
        functools.partial(pd.DataFrame(res).to_csv,
                          f"{stud_name}.csv", index=False)
    )
    return FileResponse(
        path=f"{stud_name}.csv",
        media_type="text/csv",
        filename=f"{stud_name}.csv",
    )


# Function to delete the flashcards after the user has downloaded them
@app.get("/api/delete_flashcard_request")
async def get_delete_flashcard(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    email = db.validate_student(request.headers.get("token"))[1]
    if os.path.exists(f"{email}.csv"):

        db.reset_selected_note_by_token(request.headers.get("token"))
        try:

            os.remove(f"{email}.csv")
            return True
        except classes.GenericException:

            return False

    return False
