# Imports
import google.genai
import google.generativeai as generativeai
from dotenv import load_dotenv
import os
import json
import re
import db
import google
import ast
import io
import pandas as pd

load_dotenv()
generativeai.configure(api_key=os.getenv("API_KEY"))
CACHED_FLASHCARDS = []  # [FILEID, CACHEDATA]
CACHED_QUESTIONS = []  # [FILEID, CACHEDATA]
# Create the model
client = google.genai.Client(api_key=os.getenv("API_KEY"))

model_name = "gemini-2.5-flash"
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}
model = generativeai.GenerativeModel(
    model_name=model_name,
    generation_config=generation_config,

)

completion = "How may I assist you today?"
chat_session = model.start_chat(history=[])


def check_token_no(file_path) -> bool:
    try:
        token_no = client.models.count_tokens(model=model_name, contents=client.files.upload(
            file=file_path, config={'display_name': 'test_data'})).total_tokens
        return True
    except:

        return False


def data_cleaner(value, remove_new_line: bool, isJson: bool):  # Just cleans the data

    value = value.strip()
    value = re.sub('[`]', '', value)
    if (remove_new_line):

        value = value.replace("\n", "")
    value = value.title()

    if (isJson):

        if "[" in value and "]" in value:

            try:

                # Extract the first JSON array found in the string
                start = value.index("[")
                end = value.rindex("]") + 1
                json_str = value[start:end]
                try:
                    value = ast.literal_eval(json_str)
                except Exception as e:
                    print(f"Literal eval error: {e}")
                    value = []
            except Exception as e:
                print(f"JSON decode error: {e}")
                value = []
        else:
            value = []

    return value


# Import File
try:
    notes = generativeai.upload_file(
        path=f"Data/-1.pdf", display_name=str("forgor"))
except:

    print("Cannot call default notes")


def upload_notes(notesID: int):
    return generativeai.upload_file(path=f"Data/{notesID}.pdf", display_name=str(db.getNoteByID(notesID).fileName))


def run_prompt(files, prompt):  # Base Function
    return (model.generate_content([files, prompt])).text


def flashcards(noteID):
    for i in range(len(CACHED_FLASHCARDS)):

        if CACHED_FLASHCARDS[i][0] == noteID:
            return CACHED_FLASHCARDS[i][1]

    notes = upload_notes(noteID)
    cards = str((model.generate_content(
        [notes, "Make flashcards for the notes given. Make these short flashcards witha back of no more than 20 words. Return the data as a  json object without any additional formatting or rich text backticks/identifiers LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier. A good example of how you should do it is this: [{'Front': 'I am the front of Card 1', 'Back': 'I am the back of Card 1'}, {'Front': 'I am the front of Card 2', 'Back': 'I am the back of Card 2'}d]"])).text)
    flashcards = data_cleaner(cards, True, True)
    CACHED_FLASHCARDS.append([noteID, flashcards])
    return flashcards


def summariser(noteID):  # Done

    notes = upload_notes(noteID)
    return (run_prompt(notes, "Summarise the notes"))


def custom_prompt(prompt, noteID):  # Done

    notes = upload_notes(noteID)
    return run_prompt(notes, prompt)


def make_questions(noteID):  # Done
    curr_questions = []
    iter = -1
    for i in range(len(CACHED_QUESTIONS)):

        if CACHED_QUESTIONS[i][0] == noteID:
            curr_questions = CACHED_QUESTIONS[i][1]
            iter = i
            break

    if iter == -1:

        CACHED_QUESTIONS.append([noteID, []])
        iter = len(CACHED_QUESTIONS) - 1
    if curr_questions == [] or len(curr_questions) < 3:

        notes = upload_notes(noteID)
        try:
            res = str((model.generate_content(
                [notes, f"Generate 10 questions on these notes. Return the data as a python array without any additional formatting or rich text backticks/identifiers. ONLY GIVE THE QUESTIONS AND NO ANSWERS. DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION"])).text)
            res = ast.literal_eval(data_cleaner(res, True, False))
            CACHED_QUESTIONS[iter][1] = res
            CACHED_QUESTIONS[iter][1].pop(0)
            curr_questions = CACHED_QUESTIONS[iter][1]
            return curr_questions[0]
        except:

            return "Error generating questions, please try again in a few minutes"
    else:

        CACHED_QUESTIONS[iter][1].pop(0)
        return curr_questions[0]


def check_question(question, answer, noteID):  # Done

    notes = upload_notes(noteID)
    res = (model.generate_content(
        [notes, f"is the answer {answer} correct for the question {question}"])).text
    return res


def return_flashcard_exported_format(noteID, type):

    # 1 means quizlet 2 means Other
    data = flashcards(noteID)
    res = ''
    if type == 1:  # Quizlet, SELECT COMMA, SEMILCOLON

        for i in data:

            front = i['Front']
            back = i['Back']
            res += (front + ',' + back + ';')

        return res

    elif type == 2:  # Gizmo

        return data
