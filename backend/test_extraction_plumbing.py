from fastapi.testclient import TestClient
from app import app
from unittest.mock import patch
import pytest

def test_extraction_plumbing():
    # Mock the extraction function to avoid needing real API key
    mock_data = [
        {
            "field_name": "Contract Title",
            "value": "Mock Agreement",
            "confidence": 0.99,
            "citation": "Page 1",
            "normalization": "MOCK AGREEMENT"
        }
    ]

    with patch("app.extract_data_from_text", return_value=mock_data) as mock_extract:
        with TestClient(app) as client:
            # 1. Setup Project & Doc
            p = client.post("/projects", json={"name": "ExTest", "description": "d"}).json()
            pid = p["id"]

            files = client.get("/files").json()
            if not files:
                pytest.skip("No files")
            target = files[0]

            doc = client.post(f"/projects/{pid}/ingest", json={"filename": target}).json()
            did = doc["id"]

            # 2. Call Extract
            response = client.post(f"/documents/{did}/extract")
            assert response.status_code == 200, f"Extraction failed: {response.text}"
            records = response.json()

            assert len(records) == 1
            assert records[0]["value"] == "Mock Agreement"
            assert records[0]["status"] == "pending"

            # 3. Get Records
            response = client.get(f"/documents/{did}/records")
            assert len(response.json()) == 1

if __name__ == "__main__":
    try:
        test_extraction_plumbing()
        print("Extraction plumbing test passed!")
    except Exception as e:
        print(f"Test failed: {e}")
