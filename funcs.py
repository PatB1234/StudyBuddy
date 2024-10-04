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

def quiz():

    for i in range(1):

        q = (model.generate_content([notes, "I am conducting a quiz. Give me a unique question about this topic. Make them simple questions only short response questions. DO NOT INCLUDE THE ANSWER"])).text
        print("\n\n\n" + q)
        a = input("User: ")

        r = (model.generate_content([notes, f"Is the answer {a} correct for the question {q} Tell me explicitly whetehr it is right or wrong"])).text
        print("\n\n\n" + r)

def flashcards():

    num = input("How many flashcards?\nUser: ")
    raw_cards = run_prompt(notes, f"Make {num} flashcards for the notes given.")
    processed_cards = ast.literal_eval((chat_session.send_message(f"""Parse the flashcards f{raw_cards} into a python dictionary. 
                                                     Do not add any other data I will be taking the response from you and 
                                                     using the dict() function in python to convert it into a readable manner. 
                                                  return it as a python dictionary without any additional formatting or rich text backticks/identifiers""")).text)

def summariser():

    return (run_prompt(notes, "Summarise the notes"))

def custom_prompt(prompt):
    
    return run_prompt(notes, prompt)

def make_questions():
    
    num = int(input("How many questions? "))