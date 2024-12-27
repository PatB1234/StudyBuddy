# StudyBuddy

StudyBuddy is an AI-powered application designed to help students with their studies by providing personalized learning resources.

## Features

- AI-generated learning resources
    - Flashcards
    - Questions & Answers
    - Summarisers
    - A custom, private, personal method to manipulate your notes via Google's powerful AI
- Progress tracking (In Development)
- Interactive quizzes

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/PatB1234/StudyBuddy.git
    ```
2. Navigate to the project directory:
    ```bash
    cd StudyBuddy
    ```
3. Install the required dependencies:
    ```bash
    npm install
    ```
4. Create a python env:
    ```bash
    python3 -m venv env
    ```
5. Enter your venv:
    ```bash
    source env/bin/activate
    ```
6. Install Python dependencies:
    ```bash
    pip3 install -r requirements.txt
    ```
7. Create a .env file and add your Google Gemini API Key and your 256-bit secret key for your unique encryption environment:

    API_KEY=...
    <br/>
    SECRET_KEY=...

## Usage

1. Start the application:
    ```bash
    ng serve
    ```
2. Start the backend:
    ```bash
    uvicorn main:app --reload
    ```
2. Open your browser and go to `http://localhost:4200` to access StudyBuddy.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
