# Imports
import os
import google.generativeai as genai
from dotenv import load_dotenv
from google.generativeai.types import HarmCategory, HarmBlockThreshold

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

def quiz():

    for i in range(1):

        q = (model.generate_content([notes, "I am conducting a quiz. Give me a unique question about this topic. Make them simple questions only short response questions. DO NOT INCLUDE THE ANSWER"])).text
        print("\n\n\n" + q)
        a = input("User:___ \n")

        r = (model.generate_content([notes, f"Is the answer {a} correct for the question {q} Tell me explicitly whetehr it is right or wrong"])).text
        print("\n\n\n" + r)
# Import File (RE Notes)
notes = genai.upload_file(path="Data/RE.pdf", display_name="RE Notes PDF")
print(f'File {notes.display_name} Uploaded to Gemini AI as {notes.uri}')

print("What do you want to do with this data?\n")
opt = input("")

if opt == "quiz":

    quiz()
elif opt
# response = model.generate_content([notes, opt])
# print(response.text)
# # Different potential fuctions to do w/ Data

# choice = input("What do you want to do?\n 1. Summarise notes\n 2. Make questions and answers\n 3. Make flashcards\n 4. Quit")

# while choice != 4: 
#     if choice == 1:

#         lineNum = input("Into how many bullet points?")

#         # Send to AI and ask Q
#         response = model.generate_content([notes, f"Can you summarize this document as a list of {lineNum} bullet points"])
#         print(response.text)

#     elif choice == 2:

#         qNum = input("How many questions?")

#         # Send to AI and ask Q
#         response = model.generate_content([notes, f"Can you make {qNum} questions & answers about this topic to test me. Separate the questions and answers so as to not accidentally view the answers"])
#         print(response.text)
#     elif choice == 3:

#         fNum = input("How many flashcards")
        
#         # Send to AI and ask Q
#         response = model.generate_content([notes, f"Make {fNum} flashcards with this data"])
#         print(response.text)
#     choice = input("What do you want to do?\n 1. Summarise notes\n 2. Make questions and answers\n 3. Make flashcards\n 4. Quit")

