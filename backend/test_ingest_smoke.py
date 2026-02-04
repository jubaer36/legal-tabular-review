from fastapi.testclient import TestClient
from app import app, DATA_DIR
import os
import pytest

def test_smoke_ingestion():
    with TestClient(app) as client:
        # 1. Create Project
        response = client.post("/projects", json={"name": "Smoke Test Project", "description": "Testing ingestion"})
        assert response.status_code == 200, f"Create project failed: {response.text}"
        project = response.json()
        project_id = project["id"]
        assert project["name"] == "Smoke Test Project"

        # 2. List Files
        response = client.get("/files")
        assert response.status_code == 200
        files = response.json()
        assert len(files) > 0
        print(f"Found files: {files}")

        # Pick a file (prefer html or pdf)
        target_file = next((f for f in files if f.endswith(".html") or f.endswith(".pdf")), None)
        if not target_file:
            pytest.skip("No suitable file found for testing")

        # 3. Ingest File
        response = client.post(f"/projects/{project_id}/ingest", json={"filename": target_file})
        assert response.status_code == 200, f"Ingest failed: {response.text}"
        doc = response.json()
        assert doc["filename"] == target_file
        assert doc["status"] == "ingested"
        assert len(doc["content"]) > 0
        print(f"Ingested {target_file}, content length: {len(doc['content'])}")

if __name__ == "__main__":
    # fast and dirty run if pytest not installed or just manual run
    try:
        test_smoke_ingestion()
        print("Smoke test passed!")
    except AssertionError as e:
        print(f"Smoke test failed: {e}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"An error occurred: {e}")
