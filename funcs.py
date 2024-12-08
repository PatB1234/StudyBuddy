# Imports
import google.generativeai as genai
from dotenv import load_dotenv
import os, json, ast, re

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
notes = genai.upload_file(path="Data/RE.pdf", display_name="RE Notes PDF")

def run_prompt(files, prompt): # Base Function

	return (model.generate_content([files, prompt])).text

def flashcards():

	cards = str((model.generate_content([notes, "Make flashcards for the notes given. Make these short flashcards witha back of no more than 20 words. Return the data as a  json object without any additional formatting or rich text backticks/identifiers LISTEN TO ME NO BACKTICS OR IDENTIFIERS do not put the json identifier"])).text)
	return data_cleaner(cards, True, True)

def summariser(): # Done

	return (run_prompt(notes, "Summarise the notes"))

def custom_prompt(prompt): # Done
	
	return run_prompt(notes, prompt)

def make_questions(): # Done
	
	res = str((model.generate_content([notes, f"Generate 1 questions on these notes. Return the data as a python string without any additional formatting or rich text backticks/identifiers. ONLY GIVE THE QUESTIONS AND NO ANSWERS. DONT REPEAT QUESTIONS YOU HVAE ASKED IN THE CURRENT SESSION"])).text)
	return data_cleaner(res, True, False)

def check_question(question, answer): # Done
	
	res = (model.generate_content([notes, f"is the answer {answer} correct for the question {question}"])).text
	return res

