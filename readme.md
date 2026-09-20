# StudyBuddy

StudyBuddy turns a student's own notes into revision material. Upload a PDF or a photo of handwritten
notes, and the app generates flashcards, practice questions, summaries, or the answer to whatever you
ask about them. Everything is scoped to the notes you selected, so the output is about your syllabus
rather than the model's general knowledge.

Live at [studdybuddy.app](https://studdybuddy.app). Documentation: [docs.studdybuddy.app](https://docs.studdybuddy.app). Privacy policy and ToS at [legal.studdybuddy.app](https://legal.studdybuddy.app)

## Features

- **Flashcards** generated from the selected notes, cached per note so reopening a deck is instant.
  Regenerate on demand for a fresh set.
- **Questions and answers**, where the model marks your answer against the notes rather than just
  revealing the correct one.
- **Summariser** for a condensed version of a note.
- **Custom prompts**, so you can ask anything about a note and get an answer grounded in it.
- **Handwritten notes**, converted to text with Google Cloud Vision before the model sees them. Upload
  a JPG or PNG, or tick the handwritten box on a scanned PDF.
- **Export**, either as a Quizlet-compatible string or a CSV download.
- **Notes organised by section**, with one note selected at a time as the active context.
- Guided **intro.js tours** on each page for first-time users.

## Tech stack

The frontend is Angular 18 with Angular Material, server-side rendering via `@angular/ssr`, and a
Capacitor wrapper for iOS. Markdown rendering goes through `ngx-markdown` with a custom KaTeX
extension so maths in generated content renders properly.

The backend is FastAPI on uvicorn, with SQLite for users and note metadata, JWT for auth and bcrypt
for password hashing. Generation runs on Gemini through Vertex AI, and handwriting recognition on
Google Cloud Vision.

## How it works

Every generation feature operates on one note at a time, the *active note*. The flow is the same
throughout:

1. **Upload.** `POST /api/add_notes` takes a file and a section name. The backend allocates the next
   note ID under a lock, so two simultaneous uploads can't claim the same one, and writes the file to
   `Backend/Data/<id>.pdf`.
2. **OCR, when needed.** Images always go through Cloud Vision, which extracts the text and writes it
   back out as a generated PDF. PDFs only go through OCR if the handwritten flag was set on the upload.
3. **Size check.** The backend calls `count_tokens` against the model to confirm the PDF fits in the
   context window. If it doesn't, the file is deleted and the student gets a message back rather than a
   note that fails on every later request.
4. **Record.** A row goes into the `NOTES` table holding the file ID, the original filename, the owner's
   email and the section.
5. **Select.** `POST /api/change_current_notes` sets which note is active for that token.
6. **Generate.** Every feature endpoint reads the active note ID, loads `Data/<id>.pdf` as an inline
   part, and sends it to Gemini alongside a task-specific prompt.

Notes are stored per file ID rather than per filename, so two students can upload notes with the same
name without collision. Deleting a note removes the row, the file on disk, any cached flashcard deck
and the note's cached question bank.

### Data model

Two SQLite tables, both in `Backend/db/users.db`:

```sql
STUDENTS (name TEXT, email TEXT, password TEXT, id INTEGER)
NOTES    (fileID INTEGER, fileName TEXT, ownerEmail TEXT, sectionName TEXT)
```

Sections aren't a table of their own. `sectionName` on each note is the grouping, and
`get_all_notes_tree` builds the sidebar tree by grouping rows on that column.

## Authentication

Logging in returns a JWT signed with `SECRET_KEY` using HS256. The payload holds the student's name,
email and ID, plus an expiry two days out. The frontend stores it in a `token` cookie, `Secure` only
over HTTPS, since browsers drop a `Secure` cookie on `http://localhost`.

`CookieInterceptor` reads that cookie on every outgoing request and copies it into a `token` header,
which is what the backend actually reads. `ErrorInterceptor` watches responses and redirects to
`/login` on a 401, so an expired token bounces the user to the login page rather than leaving a page
half-loaded.

Two things about the backend worth knowing:

- `/api/check_student_login` doubles as signup. If the email isn't in the database it creates the
  account and returns a token. The response includes a `created` boolean so the client can tell which
  happened, which matters because otherwise a typo'd email silently drops you into a new empty account
  that looks like a successful login.
- Endpoints that modify an account always act on whichever account the token identifies, never on an
  email in the request body. `EditUserModel` still accepts an `email` field for backwards compatibility
  with the existing client, but the server ignores it.

Passwords are hashed with bcrypt through passlib, wrapped in a `CryptContext` so the scheme can be
rotated later. Token validation is uniform across every protected endpoint: a valid token returns data
as normal, anything else returns 401.

## Generation and caching

The model is `gemini-3.5-flash` at temperature 0.3, top-p 0.95, top-k 64, with a 32,768 token output
limit. `USE_VERTEX_AI` in `funcs.py` controls whether calls go through Vertex AI with a service account
or through the Gemini API with a plain key.

Each feature caches differently:

- **Flashcards** are cached to `Backend/card_decks/<note_id>.json` and served from there on every later
  request. `/api/regenerate_flashcards` discards the cache and asks the model again. A corrupt or
  truncated cache file is treated as absent and regenerated.
- **Questions** are generated ten at a time into an in-memory bank keyed by note ID, and
  `/api/get_questions` pops one per request. When the bank empties, the next request generates another
  ten. The model call happens outside the lock, so concurrent requests for different notes aren't
  serialised behind one another.
- **Summaries and custom prompts** aren't cached. Each request hits the model.

Model responses are passed through `data_cleaner`, which strips backticks and slices out the first
JSON array in the string, so a stray markdown fence or a lead-in sentence around the list doesn't break
parsing.

Blocking, empty responses and API errors are converted into readable messages rather than raw
exceptions, so a student sees why something failed instead of a 500.

## Project layout

```
Backend/          FastAPI service
  main.py         API endpoints
  db.py           SQLite access, auth, tokens
  funcs.py        Model calls, OCR, export formatting
  classes.py      Pydantic request models
  Data/           Uploaded notes, named by note ID
  card_decks/     Cached flashcard JSON
  db/users.db     SQLite database
study-buddy/      Angular frontend
  src/app/        Components, one per feature page
nginx             Production server config
.github/workflows/deploy.yml
```

### Frontend structure

Routes are defined in `study-buddy/src/app/app.routes.ts`. The feature pages are children of
`BasePageComponent`, which provides the sidebar and the notes tree.

| Route | Component | What it does |
| --- | --- | --- |
| `/` | `IntroPageComponent` | Landing page |
| `/login` | `LoginComponent` | Login and signup |
| `/home` | `DashboardComponent` | Overview after login |
| `/add-section` | `AddSectionComponent` | Upload a note into a section |
| `/flashcards` | `FlashcardsComponent` | Deck view, regenerate, export |
| `/question-answer` | `QuestionAnswerComponent` | Practice questions and marking |
| `/summariser` | `SummariserComponent` | Summary of the active note |
| `/custom-prompt` | `CustomPromptComponent` | Free-form questions |
| `/student-profile` | `ViewStudentProfileComponent` | Account details and deletion |

Shared pieces sit alongside them: `auth-cookie.ts` for token storage, the two interceptors,
`loading.service.ts` for the global spinner, `introjs/` for the guided tours, and `katex-options.ts`
with `math-extension.ts` for maths rendering inside generated markdown.

The API base URL is a single static constant on `AppComponent`.

## Prerequisites

- Node 18+ and the Angular CLI (`npm install -g @angular/cli`)
- Python 3.12 or 3.14
- A Google Cloud project with the Vertex AI and Cloud Vision APIs enabled, plus a service account key

## Setup

1. Clone the repository and enter it:

    ```bash
    git clone https://github.com/PatB1234/StudyBuddy.git
    cd StudyBuddy
    ```

2. Install frontend dependencies:

    ```bash
    cd study-buddy
    npm install
    cd ..
    ```

3. Create a Python environment and install the backend dependencies:

    ```bash
    cd Backend
    python3 -m venv env
    source env/bin/activate
    pip install -r requirements.txt
    ```

4. Create `Backend/.env`:

    ```
    SECRET_KEY=<256-bit key for signing JWTs>
    GOOGLE_CLOUD_PROJECT=<your GCP project ID>
    GOOGLE_CLOUD_LOCATION=<region, e.g. europe-west2>
    API_KEY=<Gemini API key, only needed if USE_VERTEX_AI is set to False>
    ```

    Generate a secret key with `python3 -c "import secrets; print(secrets.token_hex(32))"`. Changing it
    later invalidates every issued token, logging everyone out.

5. Place your service account key at `Backend/gcloud_key.json` and point Google's libraries at it:

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcloud_key.json"
    ```

    `funcs.py` sets `USE_VERTEX_AI = True`, so credentials are read from the service account rather
    than `API_KEY`. Set it to `False` to use a plain Gemini API key instead. The service account needs
    the Vertex AI User role and access to Cloud Vision.

6. Create the working directories and initialise the database:

    ```bash
    mkdir -p Data card_decks db
    python3 -c "import db; db.create_tables()"
    ```

## Running locally

Start the backend from inside `Backend/`, with the virtual environment active:

```bash
uvicorn main:app --reload
```

It listens on `http://localhost:8000`. The `run.sh` at the repository root does the same two commands.
FastAPI's generated docs are at `http://localhost:8000/docs`.

Point the frontend at your local backend by editing the `URL` constant in
`study-buddy/src/app/app.component.ts`:

```ts
static URL = 'http://localhost:8000/api';
```

Then serve the app from inside `study-buddy/`:

```bash
ng serve
```

Open `http://localhost:4200`. Note that `npm start` passes `--proxy-config proxy.conf.json`, which is
not checked in, so use `ng serve` directly unless you create one.

`http://localhost:4200` is already in the backend's CORS allowlist in `main.py`. If you serve the
frontend from a different port, add it there too.

Remember to change `URL` back to the production path before committing.

## API

All endpoints are prefixed with `/api`. Every route except `/create_student` and `/check_student_login`
expects a `token` header holding the JWT issued at login; an invalid or expired token returns 401 with
`{"message": "Invalid token"}`. Tokens expire after two days.

Endpoints that operate on notes use the *active* note, set by `/change_current_notes`. With no note
selected the active ID is `-1`, and the generation endpoints return a placeholder telling the student
to pick one.

### Accounts

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| POST | `/create_student` | `{name, email, password}` | Creation result |
| POST | `/check_student_login` | `{name, email, password}` | `{token, created}`. `token` is `null` on a wrong password; `created` is `true` when the email was new and an account was made |
| GET | `/get_student_credentials` | | `{name, email, id}`, read from the database rather than the token so a rename shows up immediately |
| POST | `/edit_user` | `{newName, oldPassword, newPassword}` | Result of the edit. Always applies to the token's own account |
| POST | `/delete_user` | | Deletes the account, its notes and their files |

### Notes

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| POST | `/add_notes` | multipart: `file`, `section_name`, `handwritten` (`0` or `1`) | `{message}`, either success or the reason it was rejected |
| POST | `/get_all_user_notes_tree` | | `[{name: section, children: [{name: note}]}]` |
| POST | `/change_current_notes` | `{newNoteName}` | Sets the active note |
| POST | `/get_currently_selected_note` | | The active note |
| POST | `/delete_note_by_name` | `{noteName}` | Removes the row, the file and any cached deck |

### Generation

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/get_flashcards` | | `[{Front, Back}]`, from `card_decks/` if cached |
| GET | `/regenerate_flashcards` | | A fresh deck, replacing the cache |
| GET | `/get_questions` | | One question from the bank of ten |
| POST | `/check_question` | `{question, answer}` | The model's marking of that answer |
| GET | `/summarise` | | Summary text |
| POST | `/custom_prompt` | `{customPrompt}` | Answer to the prompt |
| GET | `/export_flashcards/{res_type}` | | `1` returns a Quizlet string (`front,back;`), `2` returns `Flashcards.csv` as a download |
| GET | `/cloud_check` | | Health check |

Uploads accept PDF, JPG, JPEG and PNG, matched on the real file extension rather than a substring of
the name. Images are always run through OCR; PDFs only when the handwritten flag is set. A PDF too
large for the model's context window is rejected with a message suggesting the handwritten option,
since OCR shrinks it considerably.

CSV exports are written to a unique temporary file per request and deleted once the response has been
sent. `/delete_flashcard_request` used to handle that cleanup and remains only so older clients keep
working.

## Tests

From the repository root:

```bash
pytest
```

The current suite covers password hashing and verification in `Backend/tests/test_db.py`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into the server, pulls, rebuilds
the Angular bundle, reinstalls Python dependencies and restarts uvicorn. It needs `SSH_KEY`, `SSH_USER`
and `SSH_HOST` as repository secrets.

nginx serves the built frontend from `dist/study-buddy/browser` and proxies `/api/` to uvicorn on port
8000, with TLS from Let's Encrypt and a 100 MB upload limit. The config is in `nginx`.

Production origins are hardcoded in the CORS allowlist in `main.py`, so a new domain needs adding there
as well as in nginx.

## Troubleshooting

**"File is too large, please try with a different file"** means `count_tokens` rejected the PDF with a
400 or 413. Tick the handwritten box: OCR replaces the scanned pages with plain text, which is far
smaller.

**"We could not process this file because the AI service is unavailable"** is a network failure or a
non-auth API error. Check the backend log for the `count_tokens failed` warning, which includes the
status code.

**"We could not process this file because the AI service rejected our credentials"** is a 401 or 403
from Google. Check that `GOOGLE_APPLICATION_CREDENTIALS` points at a readable key and that the service
account has the Vertex AI User role.

**Redirected to `/login` immediately after logging in** usually means the token cookie isn't being
stored. Over plain HTTP the cookie is written without `Secure`, so check that the frontend origin is in
the backend's CORS list and that the login response actually contained a token rather than `null`.

**Generation returns a placeholder about selecting notes** means the active note ID is `-1`. Select a
note in the sidebar first.

## Contributing

Fork the repository and open a pull request. Python is formatted with `black` and linted with `pylint`;
the frontend uses ESLint.

## License

Mozilla Public License 2.0. See [LICENSE](LICENSE).
