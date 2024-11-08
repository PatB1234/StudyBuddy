# Imports
import google.generativeai as genai
from dotenv import load_dotenv
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os, json, ast

load_dotenv()
genai.configure(api_key=os.getenv("API_KEY"))

# Create the model
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  generation_config=generation_config,

)

chat_session = model.start_chat(
  history=[
      
  ]
)


# Import File (RE Notes)
notes = genai.upload_file(path="Data/RE.pdf", display_name="RE Notes PDF")
# print(f'File {notes.display_name} Uploaded to Gemini AI as {notes.uri}')

def run_prompt(files, prompt):

    return (model.generate_content([files, prompt])).text

def flashcards():

    num = input("How many flashcards?\nUser: ")
    raw_cards = run_prompt(notes, f"Make {num} flashcards for the notes given.")
    processed_cards = ast.literal_eval((chat_session.send_message(f"""Parse the flashcards f{raw_cards} into a python dictionary. 
                                                     Do not add any other data I will be taking the response from you and 
                                                     using the dict() function in python to convert it into a readable manner. 
                                                  return it as a python dictionary without any additional formatting or rich text backticks/identifiers""")).text)

def summariser(): # Done

    return (run_prompt(notes, "Summarise the notes"))

def custom_prompt(prompt): # Done
    
    return run_prompt(notes, prompt)

def make_questions(): # Done
    
    res = str((model.generate_content([notes, f"Generate 1 questions on these notes. Return the data as a python string without any additional formatting or rich text backticks/identifiers. ONLY GIVE THE QUESTIONS AND NO ANSWERS. DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION"])).text)
    return res

def check_question(question, answer): # Done
    
    res = (model.generate_content([notes, f"is the answer {answer} correct for the question {question}"])).text
    return res

