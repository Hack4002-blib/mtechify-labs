# MS-Tech Solution - Digital Agency Website

Responsive frontend plus a FastAPI/SQLite backend for contact submissions,
lead capture, and simple chatbot responses.

## Features

- Professional navy and gold agency design
- Responsive desktop and mobile layout
- Smart rule-based chatbot with no API key required
- Contact form backed by FastAPI and SQLite
- Optional Google Sheets webhook integration
- WhatsApp order/contact links
- Scroll animations and portfolio/pricing sections

## Installation

Install the backend dependencies from the project root:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
python backend/app.py
```

The backend runs at:

```text
http://127.0.0.1:8001
```

Open the website in a browser:

```text
frontend/index.html
```

The contact form posts to `http://localhost:8001/api/contact`.

## Optional Google Sheets Webhook

Set `GOOGLE_SHEETS_URL` before starting the backend if you want contact form
submissions forwarded to a Google Apps Script webhook.
