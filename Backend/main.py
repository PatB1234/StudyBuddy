"""
Token Validation is standardised accross the functions.
If a token is valid, the function will return data as normal.
If not, a False is returned by the token validator, resulting in a 401 error in the frontend
"""

import functools
import os
import tempfile
import anyio
import shutil

import pandas as pd
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

import classes
import db
import funcs

app = FastAPI()

# Serialises note-ID allocation so concurrent uploads can't collide
UPLOAD_LOCK = anyio.Lock()

def _remove_file(path: str) -> None:
    """Delete a temporary export once its response has been sent."""
    try:
        os.remove(path)
    except OSError:
        pass


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
    """Log in, or sign up if the email is new.

    The response distinguishes the two outcomes via "created" so the client
    can say which one happened. Without that, mistyping your email silently
    drops you into a brand new empty account that looks exactly like a
    successful login.
    """
    if db.get_user_by_email(user.email) != "":

        # Account has been found with this email, check the password
        token = db.check_student_login(user.email, user.password)
        if token == 0:

            return {"token": None, "created": False}
        return {"token": token, "created": False}

    token = db.create_student_with_token(
        db.Student(name=user.name, email=user.email, password=user.password)
    )
    return {"token": token, "created": True}


@app.get("/api/get_student_credentials")
async def get_student_by_token(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    # The token identifies who is asking, but the database is the source of
    # truth for their details. Reading the name straight off the JWT meant a
    # rename did not show up until the token was reissued, up to 7 days later.
    name, email, uid = token_res
    student = db.get_user_by_email(email)
    if student == "":

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})
    return {"name": student.name, "email": student.email, "id": student.id}


@app.post("/api/edit_user")
async def edit_user(new_details: classes.EditUserModel, request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:
        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    # The account edited is always the one the token belongs to. A
    # client-supplied email must never be able to point the edit at
    # somebody else's account, so new_details.email is deliberately ignored.
    return db.edit_user(
        new_details.newName,
        token_res[1],
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

    # Match on the real extension rather than a substring of the name: the
    # old check treated "notes.pdf.txt" as a PDF, rejected "NOTES.PDF"
    # outright, and had no branch at all for ".jpeg".
    extension = os.path.splitext(file.filename)[1].lower()
    title = os.path.splitext(file.filename)[0]

    async with UPLOAD_LOCK:

        if extension == ".pdf":

            file_id = db.get_last_note_id() + 1
            file_path = os.path.join("Data", str(file_id) + ".pdf")
            await anyio.to_thread.run_sync(write_upload, file_path)

            res = ""
            if is_handwritten == 1:

                res = await anyio.to_thread.run_sync(
                    funcs.convert_handwritten_to_pdf, file_path, int(file_id)
                )

            # None means the notes are usable; anything else is a message
            # explaining what actually went wrong.
            problem = await anyio.to_thread.run_sync(
                funcs.check_token_no, file_path)

            if problem is None:

                db.add_notes(
                    request.headers.get("token"),
                    title,
                    file_id,
                    section_name,
                )
                return {"message": UPLOAD_SUCCSESFUL + res}

            if os.path.exists(file_path):

                os.remove(file_path)

            if problem == funcs.FILE_TOO_LARGE_MESSAGE and is_handwritten != 1:

                problem += (
                    ", or tick the handwritten box if these are handwritten notes"
                )
            return {"message": problem}

        # Images are always processed as handwritten notes.
        if extension in (".png", ".jpg", ".jpeg"):

            file_id = db.get_last_note_id() + 1
            file_path = os.path.join("Data", str(file_id) + extension)

            await anyio.to_thread.run_sync(write_upload, file_path)

            res = await anyio.to_thread.run_sync(
                funcs.convert_handwritten_to_pdf, file_path, int(file_id)
            )
            db.add_notes(
                request.headers.get("token"),
                title,
                file_id,
                section_name,
            )
            return {"message": UPLOAD_SUCCSESFUL + res}

        # If they are neither PDF, JPG/JPEG nor PNG, they are rejected
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
    res = await anyio.to_thread.run_sync(
        funcs.return_flashcard_exported_format,
        db.get_current_notes_by_token(request.headers.get("token")),
        res_type,
    )

    # A unique file per request: the export used to be written to
    # "<email>.csv" in the working directory, so two people exporting at the
    # same time overwrote each other's download.
    handle, csv_path = tempfile.mkstemp(prefix="flashcards-", suffix=".csv")
    os.close(handle)

    await anyio.to_thread.run_sync(
        functools.partial(pd.DataFrame(res).to_csv, csv_path, index=False)
    )
    # Cleanup runs once the response has been sent, so it no longer depends
    # on the client remembering to call /api/delete_flashcard_request.
    return FileResponse(
        path=csv_path,
        media_type="text/csv",
        filename="Flashcards.csv",
        background=BackgroundTask(_remove_file, csv_path),
    )


# Function to delete the flashcards after the user has downloaded them
@app.get("/api/delete_flashcard_request")
async def get_delete_flashcard(request: Request):

    token_res = db.validate_student(request.headers.get("token"))
    if not token_res:

        return JSONResponse(status_code=401, content={"message": TOKEN_MESSAGE})

    # The exported file is now cleaned up automatically once the download
    # response completes, so there is nothing left for this to delete. The
    # endpoint stays so existing clients keep working.
    return True
