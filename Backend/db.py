import sqlite3 as driver
from typing import Optional
import logging, os, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError, InvalidSignatureError
from passlib.context import CryptContext
from pydantic import BaseModel
import classes
load_dotenv()
logging.getLogger('passlib').setLevel(logging.ERROR)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
DATABASE_URL = 'db/users.db'
ACCESS_TOKEN_EXPIRE_MINUTES = 10080 # 7 Days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
currentNotes = [] # BIG VOLATILE ARRAY that stores all of the currently used notes by a user based on a token.

# JWT functions
def hash_password(password):

    return pwd_context.hash(password)

def verify_password(unhashed, hashed):

    return pwd_context.verify(unhashed, hashed)

class Student(BaseModel):

    name: str
    email: str
    password: str
    id: Optional[int] = -1


def cursor_func(function, fetch: bool = False):

    database = driver.connect(DATABASE_URL)
    cursor = database.cursor()
    try:

        cursor.execute(function)
        if (fetch):
            records = cursor.fetchall()
            return records

        database.commit()
    except:

        database.rollback() 


def create_tables():

    cursor_func("CREATE TABLE IF NOT EXISTS STUDENTS (name TEXT, email TEXT, password TEXT, id INTEGER);", False)
    cursor_func("CREATE TABLE IF NOT EXISTS NOTES (fileID INTEGER, fileName TEXT, ownerEmail TEXT, sectionName TEXT);", False)

### Student Functions
def get_last_id_students(): 

    students = cursor_func("SELECT * FROM STUDENTS", True)
    if students != []:

        last_student = students[len(students) - 1]
        return last_student[3]
    else:

        return -1
    
## CRUD Functions 
# Create
def create_user(student: Student):

    students = get_all_students()
    for studen in students:

        if studen.email == student.email: # Checks if the user already exists

            return "User with this email already exists, please login instead"

    id = get_last_id_students() + 1
    cursor_func(f"INSERT INTO STUDENTS (name, email, password, id) VALUES ('{student.name}', '{student.email}', '{hash_password(student.password)}', {id});", False)
    return "New user created, please login with your account"

# Read
def get_all_students():

    rawStudents = cursor_func("SELECT * FROM STUDENTS", True)
    studentArr = []
    for i in rawStudents:

        studentArr.append(Student(name=i[0], email=i[1], password=i[2], id=i[3]))

    return studentArr

def get_user_by_id(id):
    
    students = get_all_students()
    for student in students:

        if student.id == id:

            return student
        
    return "-1"

def get_user_by_name(name):
    
    students = get_all_students()
    for student in students:

        if student.name == name:

            return student
        
    return ""

def get_user_by_email(email):
    
    students = get_all_students()
    for student in students:

        if student.email == email:

            return student
        
    return ""

def does_student_exist(student: Student):

    students = get_all_students()
    if student in students:

        return 1
    
    return 0

def check_student_login(email: str, password: str):

    students = get_all_students()
    for student in students:

        if student.email == email and verify_password(password, student.password):

            # Create JWT Token
            token = get_user_token(student)
            return token
        
    return 0

# Update
def change_name(email, name):

    cursor_func(f"UPDATE STUDENTS SET name='{name}' WHERE email='{email}'")

def change_email(email_old, email_new):

    cursor_func(f"UPDATE STUDENTS SET email='{email_new}' WHERE email='{email_old}'")


def change_pwd(email, pwd):
    
    cursor_func(f"UPDATE STUDENTS SET password='{hash_password(pwd)}' WHERE email='{email}'")

def editUser(newName, email, oldPwd:str , newPwd: str):

    student = get_all_students()
    for studen in student:
        if check_student_login(email, oldPwd) != 0:

            if newName != "":

                change_name(email, newName)
            if newPwd != "":

                change_pwd(email, newPwd)
            return 1
        
    return 0

# Delete
def delete_user_id(id):

    try:
        deleteAllNotesByUserID(id)
        cursor_func(f"DELETE FROM STUDENTS WHERE id={id}", False)
    except:
        return "Error deleting user"
    return "Successfully deleted user"

def delete_user_email(email):

    cursor_func(f"DELETE FROM STUDENTS WHERE email='{email}';", False)



### JWT Functions
# Creates a user token from a student Basemodel with an expiry time of 1 week (check const ACCESS_TOKEN_EXPIRE_MINUTES)
def get_user_token(student: Student):

    to_encode = {

        'details' : {'name': student.name, 'email': student.email, 'id': student.id},
        'expiry' : str(datetime.utcnow() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES))
    }

    return jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)

# Retrieves the payload from a given token
def get_student_from_token(token):

    payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
    expiry = payload.get('expiry')
    if datetime.utcnow() >= datetime.strptime(expiry, '%Y-%m-%d %H:%M:%S.%f'):

        return "Token Expired"
    else: 
        return payload.get('details')
    
# Validates the user's token and returns the details if it is.
def validate_student(token):
    try: 
        res = get_student_from_token(token)
        if res == "Token Expired":
            
            return False
        
        else:


            # Returns details in the form of a list
            return [res['name'], res['email'], res['id']]
    
    # If the token is invalid, return False
    except InvalidTokenError:

        return False
    # If the token cannot be decoded, return False 
    except InvalidSignatureError:

        return False
    


### Notes functions
##CRUD Functions for notes
# Add notes to the database
def addNotes(token, fileName, fileID, sectionName): 
    cursor_func(f"INSERT INTO NOTES (fileID, fileName, ownerEmail, sectionName) VALUES ({int(fileID)}, '{fileName}', '{get_student_from_token(token)['email']}', '{sectionName}');", False)

# Change the section name
def changeNotesSection(): pass

# Change the notes name
def changeNotesName(): pass

# Update owner email
def updateOwnerEmail(): pass

# Get all notes from an email
def getNotesByEmail(ownerEmail: str): 
    
    return cursor_func(f"SELECT * FROM NOTES WHERE ownerEmail='{ownerEmail}'", True)
# Get all notes within a specific section
def getNotesBySectionName(): pass

# Get notes by noteID
def getNoteByID(noteID: int) -> classes.notes:
    notes = cursor_func(f"SELECT * FROM NOTES WHERE fileID={noteID}", True)
    if (notes == []):

        return classes.notes(fileID=-1, fileName="-1.txt", ownerEmail="", sectionName = "")
    else:
        notes = notes[0]
        return classes.notes(fileID=int(notes[0]), fileName=notes[1], ownerEmail=notes[2], sectionName=notes[3])

# Get current notes by token
def getCurrentNotesByToken(token):

    for i in currentNotes: # Gets the note that is currently being used by a user based on their token

        if i[0] == token:

            return i[1]
        
    return -1

#Get the noteID based on the token and the note's name
def getNoteIDByNoteName(token: str, noteName: str):

    email = validate_student(token)[1]
    res = cursor_func(f"SELECT * FROM NOTES WHERE ownerEmail='{email}' AND fileName='{noteName}';", True)

    if len(res) != 0:
        return int(res[0][0])
    else: 
        return -1


# Change currently examined notes
def changeCurrentNotes(token: str, noteName: str):
    newNoteID = getNoteIDByNoteName(token, noteName)
    found = False
    for i in range(len(currentNotes)):

        if currentNotes[i][0] == token:

            currentNotes[i][1] = newNoteID
            found = True
            return 1
        
    if (found == False): # Add to array incase the user's notes are not in the volatile array for some odd reason

        currentNotes.append([token, newNoteID])

        
    return 0 

# Delete all notes for a specific user
def deleteAllNotesByUserID(id: int):
    
    res = cursor_func(f"SELECT fileID FROM NOTES WHERE ownerEmail=(SELECT email FROM STUDENTS WHERE id={id})", True)
    for id in res:
        
        deleteNotesByID(int(id[0]))
# Delete notes by ID pass
def deleteNotesByID(id: int):
    # Delete the actual file with the id
    try:
        cursor_func(f"DELETE FROM NOTES WHERE fileID={id}", False)
        os.remove(f"Data/{id}.pdf")
    except FileNotFoundError:
        logging.error(f"File with ID {id} does not exist.")


# Delete a user's notes by the name & user token
def deleteNoteByName(noteName: str, token: str):

    email = validate_student(token)[1]
    noteID = getNoteIDByNoteName(token, noteName)

    if noteID == -1:
        return "Note not found"

    cursor_func(f"DELETE FROM NOTES WHERE fileID={noteID} AND ownerEmail='{email}'", False)
    return "Note deleted successfully"

# Delete notes by email
def deleteNotesByEmail(): pass

#Get Last note ID:
def getLastNoteID():

    currLargest = -1
    notes = cursor_func("SELECT * FROM NOTES", True)
    for note in notes:
        if note[0] > currLargest:

            currLargest = note[0]

    return currLargest


# Get all the notes in an acceptable tree fashion for a specific user
def getAllNotesTree(ownerEmail: str):
    sections = getNotesByEmail(ownerEmail)  # Fetch notes by email

    # Group sections by their names
    grouped_sections = {}
    for section in sections:
        section_name = section[3]  # Section name
        if section_name not in grouped_sections:
            grouped_sections[section_name] = []
        grouped_sections[section_name].append(section)

    # Build the tree structure
    tree_structure = []
    for section_name, notes in grouped_sections.items():
        tree_structure.append({
            "name": section_name,
            "children": [{"name": note[1]} for note in notes]  # Add notes as children
        })

    return tree_structure