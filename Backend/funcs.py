# Imports
import ast
import logging
import os
import re
import json
import threading

from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from google.cloud import vision
from dotenv import load_dotenv
from fpdf import FPDF
import classes

load_dotenv()
CACHED_QUESTIONS = []  # [FILEID, CACHEDATA]
# Requests are now handled concurrently (see main.py), so CACHED_QUESTIONS -
# a module-level list shared across every in-flight request - needs a lock
# around its reads/writes to avoid two requests corrupting it at once.
CACHED_QUESTIONS_LOCK = threading.Lock()
# This represents the client link for the Google cloud vision API.
visionClient = vision.ImageAnnotatorClient()

MODEL_NAME = "gemini-3.5-flash"

# Set GOOGLE_GENAI_USE_VERTEXAI=true to talk to Vertex AI (using the service
# account in GOOGLE_APPLICATION_CREDENTIALS) instead of the Gemini API key.
USE_VERTEX_AI = True

# Overridable per environment; the defaults are what the project actually
# uses, so a fresh checkout works without any env setup. The old code passed
# the project ID to os.getenv as if it were a variable name, which returned
# None and only worked because Vertex fell back to the local gcloud default.
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "student-ai-st-chris")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "europe-west2")

if USE_VERTEX_AI:
    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION,
    )
else:
    client = genai.Client(api_key=os.getenv("API_KEY"))

generation_config = genai_types.GenerateContentConfig(
    temperature=0.3,
    top_p=0.95,
    top_k=64,
    max_output_tokens=32768,
    response_mime_type="text/plain",
)

MODEL_ERRORS = (classes.GenericException, genai_errors.APIError)


def generate(contents, context: str):
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=generation_config,
    )
    return _extract_response_text(response, context)


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


FILE_TOO_LARGE_MESSAGE = "File is too large, please try with a different file"
AI_UNAVAILABLE_MESSAGE = (
    "We could not process this file because the AI service is unavailable. "
    "Please try again in a few minutes."
)
AI_AUTH_MESSAGE = (
    "We could not process this file because the AI service rejected our "
    "credentials. Please let the site owner know."
)


def check_token_no(file_path):
    """Return None when the notes are usable, else a user-facing message.

    Previously this returned a bare False for every failure, so an auth
    problem or a network blip was reported to the student as "file is too
    large" - which sent them off trying to shrink a perfectly fine PDF.
    """
    try:
        with open(file_path, "rb") as f:
            file_payload = genai_types.Part.from_bytes(
                data=f.read(), mime_type="application/pdf")
        client.models.count_tokens(model=MODEL_NAME, contents=[file_payload])
        return None
    except genai_errors.APIError as e:
        code = getattr(e, "code", None) or getattr(e, "status_code", None)
        logging.warning(
            "count_tokens failed for %s (code=%s): %s", file_path, code, e)

        if code in (400, 413):

            return FILE_TOO_LARGE_MESSAGE
        if code in (401, 403):

            return AI_AUTH_MESSAGE
        return AI_UNAVAILABLE_MESSAGE
    except (OSError, classes.GenericException):

        logging.exception("Could not read uploaded file %s", file_path)
        return AI_UNAVAILABLE_MESSAGE


def data_cleaner(value, remove_new_line: bool, is_json: bool):  # Just cleans the data

    value = value.strip()
    value = re.sub("[`]", "", value)
    if remove_new_line:

        value = value.replace("\n", "")

    if is_json:

        if "[" in value and "]" in value:

            try:

                # Extract the first JSON array found in the string
                start = value.index("[")
                end = value.rindex("]") + 1
                json_str = value[start:end]
                try:
                    value = ast.literal_eval(json_str)
                except (ValueError, SyntaxError) as e:
                    print(f"Literal eval error: {e}")
                    value = []
            except ValueError as e:
                print(f"JSON decode error: {e}")
                value = []
        else:
            value = []

    return value


def upload_notes(note_id: int):
    with open(f"Data/{note_id}.pdf", "rb") as f:

        file_payload = genai_types.Part.from_bytes(
            data=f.read(), mime_type="application/pdf")

    return file_payload


def run_prompt(files, prompt):  # Base Function
    try:
        return generate([files, prompt], "prompt")
    except MODEL_ERRORS as e:
        return str(e)


NO_NOTES_SELECTED_DECK = [
    {
        "Front": "You forgot to select flashcards",
        "Back": "Select flashcards on the left-hand side to use this function",
    }
]

FLASHCARD_PROMPT = (
    "Make flashcards for the notes given. "
    + "Make these short flashcards witha back of no more than 20 words."
    + " Return the data as a  json object without"
    + " any additional formatting or rich text backticks/identifiers "
    + "LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier."
    + " A good example of how you should do it is this: "
    + "[{'Front': 'I am the front of Card 1', 'Back': 'I am the back of Card 1'}, "
    + "{'Front': 'I am the front of Card 2', 'Back': 'I am the back of Card 2'}]"
)


def _deck_path(note_id) -> str:

    return os.path.join("card_decks", str(note_id) + ".json")


def _read_cached_deck(note_id):
    """Return the deck saved for this note, or None when there isn't one."""
    file_path = _deck_path(note_id)
    if not os.path.exists(file_path):

        return None

    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except (OSError, ValueError):

        # A truncated or corrupt cache file should just be regenerated.
        return None


def _generate_deck(note_id):
    """Ask the model for a fresh deck and cache it, replacing any existing one."""
    uploaded_notes = upload_notes(note_id)
    try:
        cards = generate([uploaded_notes, FLASHCARD_PROMPT], "flashcard")
    except MODEL_ERRORS as e:
        return [
            {
                "Front": "Unable to generate flashcards right now",
                "Back": str(e),
            }
        ]

    generated_flashcards = data_cleaner(cards, False, True)

    os.makedirs("card_decks", exist_ok=True)
    with open(_deck_path(note_id), "w") as f:
        f.write(json.dumps(generated_flashcards, indent=4))

    return generated_flashcards


def flashcards(note_id):
    """Return the cached deck for these notes, generating one if needed."""
    if str(note_id) == "-1":

        return NO_NOTES_SELECTED_DECK

    cached = _read_cached_deck(note_id)
    if cached is not None:

        return cached

    return _generate_deck(note_id)


def regenerate_flashcards(note_id):
    """Always ask the model for a new deck, discarding any cached one."""
    if str(note_id) == "-1":

        return NO_NOTES_SELECTED_DECK

    return _generate_deck(note_id)


def summariser(note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    return run_prompt(uploaded_notes, "Summarise the notes")


def custom_prompt(prompt, note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    print(note_id)
    return run_prompt(uploaded_notes, prompt)


def _cached_questions_for(note_id):
    """Return the cached question list for note_id, creating it if absent.

    Always looked up by note_id rather than by a saved index: entries are
    removed by delete_notes_by_id, so an index captured earlier can go stale.
    Callers must hold CACHED_QUESTIONS_LOCK.
    """
    for entry in CACHED_QUESTIONS:
        if entry[0] == note_id:
            return entry[1]

    CACHED_QUESTIONS.append([note_id, []])
    return CACHED_QUESTIONS[-1][1]


def make_questions(note_id):  # Done
    with CACHED_QUESTIONS_LOCK:
        cached = _cached_questions_for(note_id)
        # Serve from the bank until it is empty. pop returns the question we
        # hand back, so nothing is silently dropped.
        if cached:
            return cached.pop(0)

    # The Gemini call happens outside the lock so that concurrent requests
    # for *different* notes aren't serialised behind a single network call.
    uploaded_notes = upload_notes(note_id)
    try:
        res = generate(
            [
                uploaded_notes,
                "Generate 10 questions on these notes. "
                + "Return the data as a python array without any "
                + "additional formatting or rich text backticks/identifiers. "
                + "ONLY GIVE THE QUESTIONS AND NO ANSWERS. "
                + "DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION",
            ],
            "question generation",
        )
        # data_cleaner slices out the first [...] array, so a stray markdown
        # fence or lead-in sentence around the list doesn't break parsing.
        res = data_cleaner(res, True, True)
        if not res:
            return "Error generating questions, please try again in a few minutes"
        with CACHED_QUESTIONS_LOCK:
            cached = _cached_questions_for(note_id)
            cached[:] = res
            return cached.pop(0)
    except MODEL_ERRORS:

        return "Error generating questions, please try again in a few minutes"


def check_question(question, answer, note_id):  # Done

    uploaded_notes = upload_notes(note_id)
    try:
        return generate(
            [
                uploaded_notes,
                f"is the answer {answer} correct for the question {question}",
            ],
            "answer check",
        )
    except MODEL_ERRORS as e:
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


# def convert_handwritten_to_pdf(file_path, file_id):
#     try:
#         with open(file_path, "rb") as image_file:
#             content = image_file.read()
#         image = vision.Image(content=content)
#         data = ""

#         response = visionClient.document_text_detection(image=image)
#         for page in response.full_text_annotation.pages:
#             for block in page.blocks:
#                 for paragraph in block.paragraphs:
#                     for word in paragraph.words:

#                         word_text = "".join(
#                             [symbol.text for symbol in word.symbols])
#                         data += word_text + " "

#         os.remove(file_path)
#         pdf = FPDF()
#         pdf.add_page()
#         pdf.set_font("Arial", "B", 12)
#         pdf.multi_cell(0, 10, txt=data)
#         pdf.output(f"Data/{file_id}.pdf")
#         return "Successfully converted your handwritten PDF to text, " \
#             + "please proceed with the app as normal"
#     except classes.GenericException:

#         return "Could not convert handwritten pdf to text"


# fpdf 1.7.2 writes latin-1 only. That covers Western European accents
# (cafe, naive, resume survive), but silently turns typographic punctuation,
# Greek letters and maths symbols into "?" - exactly what science notes are
# full of. Map those to readable ASCII before encoding.
PDF_CHARACTER_REPLACEMENTS = {
    "\u2014": "-", "\u2013": "-", "\u2212": "-",
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2026": "...", "\u00b7": ".", "\u2022": "-",
    "\u2248": "~=", "\u2260": "!=", "\u2264": "<=", "\u2265": ">=",
    "\u00d7": "x", "\u00f7": "/", "\u221a": "sqrt", "\u221e": "infinity",
    "\u2211": "sum", "\u220f": "product", "\u222b": "integral",
    "\u2202": "d", "\u2207": "grad", "\u00b0": " degrees",
    "\u0394": "Delta", "\u03b4": "delta", "\u03bc": "u", "\u03c0": "pi",
    "\u03b1": "alpha", "\u03b2": "beta", "\u03b3": "gamma",
    "\u03bb": "lambda", "\u03c3": "sigma", "\u03a9": "Omega",
    "\u03b8": "theta", "\u03c6": "phi", "\u03c9": "omega",
    "\u2192": "->", "\u2190": "<-", "\u21d2": "=>", "\u00b1": "+/-",
}


def to_pdf_safe_text(data: str) -> str:
    """Make text writable by a latin-1 PDF without losing its meaning."""
    for source, replacement in PDF_CHARACTER_REPLACEMENTS.items():

        data = data.replace(source, replacement)
    return data.encode("latin-1", errors="replace").decode("latin-1")


def convert_handwritten_to_pdf(file_path, file_id):

    try:

        with open(file_path, "rb") as image_file:
            content = image_file.read()
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        res = client.document_text_detection(image=image)

        if res.error.message:

            raise RuntimeError(f"Error from Vision API: {res.error.message}")

        data = res.full_text_annotation.text

        if not data.strip():

            return "No text could be extracted from this image. Please try again with a new image or better handwriting :)"

        os.remove(file_path)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        # Remove special characters to avoid an FPDF Crash
        safe_data = to_pdf_safe_text(data)
        pdf.multi_cell(0, 10, txt=safe_data)
        os.makedirs("Data", exist_ok=True)
        pdf.output(f"Data/{file_id}.pdf")
        return "Successfully converted your handwritten PDF to text, " \
            + "please proceed with the app as normal"
    except FileNotFoundError:
        return "Could not find the uploaded image file"
    except RuntimeError as e:
        return str(e)
    except Exception as e:
        print(f"[convert_handwritten_to_pdf] Unexpected error: {e}")
        return "Could not convert handwritten notes to text"
