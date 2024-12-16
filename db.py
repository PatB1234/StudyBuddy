import sqlite3 as driver
from sqlite3.dbapi2 import Cursor
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional
import logging, os
from dotenv import load_dotenv

load_dotenv()
logging.getLogger('passlib').setLevel(logging.ERROR)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
DATABASE_URL = 'db/users.db'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

    id = get_last_id_students() + 1
    cursor_func(f"INSERT INTO STUDENTS (name, email, password, id) VALUES ('{student.name}', '{student.email}', '{hash_password(student.password)}', {id});", False)

# Read
def get_all_users():

    rawStudents = cursor_func("SELECT * FROM STUDENTS", True)
    studentArr = []
    for i in rawStudents:

        studentArr.append(Student(name=i[0], email=i[1], password=i[2], id=i[3]))

    return studentArr

def get_user_by_id(id):
    
    students = get_all_users()
    for student in students:

        if student.id == id:

            return student
        
    return "-1"

def get_user_by_name(name):
    
    students = get_all_users()
    for student in students:

        if student.name == name:

            return student
        
    return ""

def get_user_by_email(email):
    
    students = get_all_users()
    for student in students:

        if student.email == email:

            return student
        
    return ""



# Update
def change_name(email, name):

    cursor_func(f"UPDATE STUDENTS SET name='{name}' WHERE email='{email}'")

def change_email(email_old, email_new):

    cursor_func(f"UPDATE STUDENTS SET email='{email_new}' WHERE email='{email_old}'")


def change_pwd(email, pwd):
    
    cursor_func(f"UPDATE STUDENTS SET password='{hash_password(pwd)}' WHERE email='{email}'")


# Delete
def delete_user_id(id):

    cursor_func(f"DELETE FROM STUDENTS WHERE id={id}", False)

def delete_user_email(email):

    cursor_func(f"DELETE FROM STUDENTS WHERE email='{email}';", False)

