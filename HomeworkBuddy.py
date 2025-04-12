# Imports
from funcs import *

opt = -1

while opt != 10:

    print("What do you want to do with this data?\n")
    print(" 1. Quiz back & forth with the AI\n") # Completed
    print(" 2. Make flashcards with your notes\n") # Completed
    print(" 3. Upload notes via device camera or file upload\n")
    print(" 4. Summarise notes\n") # Completed
    print(" 5. Create a number of questions & answers\n")
    print(" 6. Analayse weak areas\n") # Later
    print(" 7. View quiz history\n") # Later
    print(" 8. Download generated content\n") # Later
    print(" 9. Custom prompt\n") # Completed
    print(" 10. Exit\n") # Completed
    opt = int(input("User: "))

    if opt == 1:

    elif opt == 2:
        
        print(flashcards())

    elif opt == 3:
        
        pass

    elif opt == 4:
        
        print(summariser())

    elif opt == 5:
        
        pass

    elif opt == 6:
        
        pass

    elif opt == 7:
        
        pass
    elif opt == 8:
        
        pass

    elif opt == 9:
        
        print(custom_prompt(input("Please enter your prompt for the AI:\n")))

    input("Press enter to continue")