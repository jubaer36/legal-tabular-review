import os
from pypdf import PdfReader
from bs4 import BeautifulSoup

def parse_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise ValueError(f"Error parsing PDF: {e}")

def parse_html(file_path: str) -> str:
    """Extracts text from an HTML file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")
            # Get text with some structure preservation (newlines)
            return soup.get_text(separator="\n")
    except Exception as e:
        raise ValueError(f"Error parsing HTML: {e}")

def parse_document(file_path: str) -> str:
    """Determines file type and calls appropriate parser."""
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in [".html", ".htm"]:
        return parse_html(file_path)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}")
