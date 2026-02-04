import os
import json
from typing import List, Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Default fields if no schema is provided
DEFAULT_FIELDS = [
    {"name": "Contract Title", "description": "The title of the agreement"},
    {"name": "Effective Date", "description": "The date the agreement becomes effective"},
    {"name": "Parties", "description": "The names of the parties entering the agreement"},
    {"name": "Governing Law", "description": "The law governing the agreement"},
    {"name": "Termination Clause", "description": "Conditions under which the agreement can be terminated"}
]

def get_groq_client():
    if not GROQ_API_KEY:
        # Fail gracefully or mock?
        # For now, let's raise an error so the user knows they need the key.
        # But for the purpose of the "Environment Setup Guide" step, we might want to avoid crashing
        # if the user hasn't put the key in yet, but tries to run the app.
        # However, the extraction *action* should definitely fail.
        return None
    return Groq(api_key=GROQ_API_KEY)

def generate_extraction_prompt(text: str, fields: List[Dict[str, str]]) -> str:
    fields_str = json.dumps(fields, indent=2)
    prompt = f"""
    You are a legal AI assistant. Extract the following fields from the document text provided below.

    Fields to extract:
    {fields_str}

    For each field, provide:
    - value: The extracted text.
    - confidence: A score between 0.0 and 1.0.
    - citation: The specific location or context where this was found (quote the text).
    - normalization: A normalized version of the value (e.g., ISO date, uppercase title).

    Return the output as a strict JSON object with a "results" key containing a list of objects.
    Each object in the list should have "field_name" matching the requested field name, plus the properties above.

    If a field is not found, set "value" to null.

    Document Text:
    {text[:20000]}

    (Note: Text truncated to first 20000 chars for this demo to fit context window if needed)
    """
    # Note: 20k chars is a rough limit, might need better chunking for real prod,
    # but acceptable for a "vertical slice" demo.
    return prompt

def extract_data_from_text(text: str, fields: List[Dict[str, str]] = DEFAULT_FIELDS) -> List[Dict[str, Any]]:
    client = get_groq_client()
    if not client:
        raise ValueError("GROQ_API_KEY not set in environment variables")

    prompt = generate_extraction_prompt(text, fields)

    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192", # Strong model for extraction
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )

        content = completion.choices[0].message.content
        data = json.loads(content)
        return data.get("results", [])
    except Exception as e:
        print(f"Extraction error: {e}")
        # Return empty list or re-raise depending on desired behavior
        raise e
