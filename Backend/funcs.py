# Imports
import ast
import os
import re
import json

import google.generativeai as genai
from google.cloud import vision
from dotenv import load_dotenv
from fpdf import FPDF
import classes

load_dotenv()
genai.configure(api_key=os.getenv("API_KEY"))
CACHED_QUESTIONS = []  # [FILEID, CACHEDATA]
# This represents the client link for the Google cloud vision API.
visionClient = vision.ImageAnnotatorClient()

MODEL_NAME = "gemini-2.5-flash"
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}
model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=generation_config,
)

chat_session = model.start_chat(history=[])


def _extract_response_text(response, context: str):
    candidates = getattr(response, "candidates", None) or []
    text_parts = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) if content else None
        if not parts:
            continue
        for part in parts:
            text_val = getattr(part, "text", None)
            if text_val:
                text_parts.append(text_val)
    if text_parts:
        return "".join(text_parts).strip()

    feedback = getattr(response, "prompt_feedback", None)
    block_reason = getattr(feedback, "block_reason",
                           None) if feedback else None
    if block_reason:
        raise classes.GenericException(
            f"Model blocked the {context} request ({block_reason}). "
            + "Please try again with different wording or a smaller file."
        )
    raise classes.GenericException(
        f"Model returned an empty response for {context} generation."
    )


def check_token_no(file_path) -> bool:
    try:
        with open(file_path, "rb") as f:
            file_payload = {"mime_type": "application/pdf", "data": f.read()}
        _ = model.count_tokens([file_payload]).total_tokens
        return True
    except classes.GenericException:

        return False


def data_cleaner(value, remove_new_line: bool, is_json: bool):  # Just cleans the data

    value = value.strip()
    value = re.sub("[`]", "", value)
    if remove_new_line:

        value = value.replace("\n", "")
    value = value.title()

    if is_json:

        if "[" in value and "]" in value:

            try:

                # Extract the first JSON array found in the string
                start = value.index("[")
                end = value.rindex("]") + 1
                json_str = value[start:end]
                try:
                    value = ast.literal_eval(json_str)
                except classes.GenericException as e:
                    print(f"Literal eval error: {e}")
                    value = []
            except classes.GenericException as e:
                print(f"JSON decode error: {e}")
                value = []
        else:
            value = []

    return value


# # Import File
# try:
#     notes = genai.upload_file(
#         path="Data/-1.pdf")
# except classes.GenericException:

#     print("Cannot call default notes")


def upload_notes(note_id: int):
    # return genai.upload_file(path=f"Data/{note_id}.pdf")
    with open(f"Data/{note_id}.pdf", "rb") as f:

        file_payload = {"mime_type": "application/pdf", "data": f.read()}

    return file_payload


def run_prompt(files, prompt):  # Base Function
    try:
        response = model.generate_content([files, prompt])
        return _extract_response_text(response, "prompt")
    except classes.GenericException as e:
        return str(e)


def flashcards(note_id):
    if (note_id == -1 or note_id == '-1'):

        file_path = os.path.join("card_decks", str(note_id) + ".json")
        with open(file_path, "w") as f:

            f.write(json.dumps([{'Front': 'You forgot to select flashcards',
                    'Back': 'Select flashcards on the left-hand side to use this function'}], indent=4))

    file_path = os.path.join("card_decks", str(note_id) + ".json")

    if os.path.exists(file_path):

        with open(file_path, 'r') as file:
            data = json.load(file)
            print(data)
            return data

    uploaded_notes = upload_notes(note_id)
    try:
        cards = _extract_response_text(
            model.generate_content(
                [
                    uploaded_notes,
                    "Make flashcards for the notes given. "
                    + "Make these short flashcards witha back of no more than 20 words."
                    + " Return the data as a  json object without"
                    + " any additional formatting or rich text backticks/identifiers "
                    + "LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier."
                    + " A good example of how you should do it is this: "
                    + "[{'Front': 'I am the front of Card 1', 'Back': 'I am the back of Card 1'}, "
                    + "{'Front': 'I am the front of Card 2', 'Back': 'I am the back of Card 2'}]",
                ]
            ),
            "flashcard",
        )
    except classes.GenericException as e:
        return [
            {
                "Front": "Unable to generate flashcards right now",
                "Back": str(e),
            }
        ]
    print(cards)
    generated_flaschards = data_cleaner(cards, False, True)

    json_str = json.dumps(generated_flaschards, indent=4)
    file_path = os.path.join("card_decks", str(note_id) + ".json")
    if not os.path.exists(file_path):

        with open(file_path, "w") as f:

            f.write(json_str)
    else:
        os.remove(file_path)

        with open(file_path, "w") as f:
            f.write(json_str)

    return generated_flaschards


def regenerate_flashcards(note_id):
    if (note_id == -1 or note_id == '-1'):

        file_path = os.path.join("card_decks", str(note_id) + ".json")
        with open(file_path, "w") as f:

            f.write(json.dumps([{'Front': 'You forgot to select flashcards',
                    'Back': 'Select flashcards on the left-hand side to use this function'}], indent=4))

        if os.path.exists(file_path):

            with open(file_path, 'r') as file:
                data = json.load(file)
                print(data)
                return data

    uploaded_notes = upload_notes(note_id)
    try:
        cards = _extract_response_text(
            model.generate_content(
                [
                    uploaded_notes,
                    "Make flashcards for the notes given. "
                    + "Make these short flashcards witha back of no more than 20 words."
                    + " Return the data as a  json object without"
                    + " any additional formatting or rich text backticks/identifiers "
                    + "LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier."
                    + " A good example of how you should do it is this: "
                    + "[{'Front': 'I am the front of Card 1', 'Back': 'I am the back of Card 1'}, "
                    + "{'Front': 'I am the front of Card 2', 'Back': 'I am the back of Card 2'}]",
                ]
            ),
            "flashcard",
        )
    except classes.GenericException as e:
        return [
            {
                "Front": "Unable to generate flashcards right now",
                "Back": str(e),
            }
        ]
    generated_flaschards = data_cleaner(cards, False, True)

    json_str = json.dumps(generated_flaschards, indent=4)
    file_path = os.path.join("card_decks", str(note_id) + ".json")

    if not os.path.exists(file_path):

        with open(file_path, "w") as f:
            f.write(json_str)
    else:
        os.remove(file_path)

        with open(file_path, "w") as f:

            f.write(json_str)

    return generated_flaschards


def summariser(note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    return run_prompt(uploaded_notes, "Summarise the notes")


def custom_prompt(prompt, note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    print(note_id)
    return run_prompt(uploaded_notes, prompt)


def make_questions(note_id):  # Done
    curr_questions = []
    index = -1
    for i, val in enumerate(CACHED_QUESTIONS):

        if val[0] == note_id:
            curr_questions = val[1]
            index = i
            break
    print(note_id, index)
    if index == -1:

        CACHED_QUESTIONS.append([note_id, []])
        index = len(CACHED_QUESTIONS) - 1
    if curr_questions == [] or len(curr_questions) < 3:

        uploaded_notes = upload_notes(note_id)
        try:
            res = _extract_response_text(
                model.generate_content(
                    [
                        uploaded_notes,
                        "Generate 10 questions on these notes. "
                        + "Return the data as a python array without any "
                        + "additional formatting or rich text backticks/identifiers. "
                        + "ONLY GIVE THE QUESTIONS AND NO ANSWERS. "
                        + "DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION",
                    ]
                ),
                "question generation",
            )
            res = ast.literal_eval(data_cleaner(res, True, False))
            CACHED_QUESTIONS[index][1] = res
            CACHED_QUESTIONS[index][1].pop(0)
            curr_questions = CACHED_QUESTIONS[index][1]
            print(CACHED_QUESTIONS)
            return curr_questions[0]
        except classes.GenericException:

            return "Error generating questions, please try again in a few minutes"
    else:

        CACHED_QUESTIONS[index][1].pop(0)
        return curr_questions[0]


def check_question(question, answer, note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    try:
        return _extract_response_text(
            model.generate_content(
                [
                    uploaded_notes,
                    f"is the answer {answer} correct for the question {question}",
                ]
            ),
            "answer check",
        )
    except classes.GenericException as e:
        return str(e)


def return_flashcard_exported_format(note_id, note_type):

    # 1 means quizlet 2 means Other
    data = flashcards(note_id)
    res = ""
    if note_type == 1:  # Quizlet, SELECT COMMA, SEMILCOLON

        for i in data:

            front = i["Front"]
            back = i["Back"]
            res += front + "," + back + ";"

        return res

    elif note_type == 2:  # Gizmo

        return data


def convert_handwritten_to_pdf(file_path, file_id):
    try:
        with open(file_path, "rb") as image_file:
            content = image_file.read()
        image = vision.Image(content=content)
        data = ""

        response = visionClient.document_text_detection(image=image)
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    for word in paragraph.words:

                        word_text = "".join(
                            [symbol.text for symbol in word.symbols])
                        data += word_text + " "

        os.remove(file_path)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 12)
        pdf.multi_cell(0, 10, txt=data)
        pdf.output(f"Data/{file_id}.pdf")
        return "Successfully converted your handwritten PDF to text, " \
            + "please proceed with the app as normal"
    except classes.GenericException:

        return "Could not convert handwritten pdf to text"
