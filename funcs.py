# Imports
import google.generativeai as genai
from dotenv import load_dotenv
import os, json, ast, re, db, classes

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
    model_name = "gemini-2.0-flash",
  generation_config=generation_config,

)

chat_session = model.start_chat(
  history=[
	  
  ]
)

def data_cleaner(value, remove_new_line: bool, isJson: bool): # Just cleans the data
		
	value = value.strip()
	value = re.sub('[`]', '', value)
	if (remove_new_line):

		value = value.replace("\n", "")    
	value = value.title()

	if (isJson):

		value = json.loads(value[value.index("["):])
			
	return value

# Import File (RE Notes)
notes =  genai.upload_file(path=f"Data/-1.pdf", display_name=str("forgor"))

def upload_notes(notesID: int):
	return genai.upload_file(path=f"Data/{notesID}.pdf", display_name=str(db.getNoteByID(notesID).fileName))


def run_prompt(files, prompt): # Base Function
	return (model.generate_content([files, prompt])).text

def flashcards(noteID):

	notes = upload_notes(noteID)
	cards = str((model.generate_content([notes, "Make flashcards for the notes given. Make these short flashcards witha back of no more than 20 words. Return the data as a  json object without any additional formatting or rich text backticks/identifiers LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier. A good example of how you should do it is this: [{'Front': 'I am the front of Card 1', 'Back': 'I am the back of Card 1'}, {'Front': 'I am the front of Card 2', 'Back': 'I am the back of Card 2'}d]"])).text)
	print(data_cleaner(cards, True, True))
	return data_cleaner(cards, True, True)

def summariser(noteID): # Done

	notes = upload_notes(noteID)
	return (run_prompt(notes, "Summarise the notes"))

def custom_prompt(prompt, noteID): # Done
	
	notes = upload_notes(noteID)
	return run_prompt(notes, prompt)

def make_questions(noteID): # Done
	
	notes = upload_notes(noteID)
	res = str((model.generate_content([notes, f"Generate 1 questions on these notes. Return the data as a python string without any additional formatting or rich text backticks/identifiers. ONLY GIVE THE QUESTIONS AND NO ANSWERS. DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION"])).text)
	return data_cleaner(res, True, False)

def check_question(question, answer, noteID): # Done
	
	notes = upload_notes(noteID)
	res = (model.generate_content([notes, f"is the answer {answer} correct for the question {question}"])).text
	return res

