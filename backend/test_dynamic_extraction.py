from fastapi.testclient import TestClient
from app import app
from unittest.mock import patch
import pytest

def test_dynamic_extraction():
    with TestClient(app) as client:
        # 1. Setup Project & Doc
        p = client.post("/projects", json={"name": "DynExTest", "description": ""}).json()
        pid = p["id"]

        files = client.get("/files").json()
        if not files: pytest.skip("No files")
        d = client.post(f"/projects/{pid}/ingest", json={"filename": files[0]}).json()
        did = d["id"]

        # 2. Add Custom Schema
        client.post(f"/projects/{pid}/schema", json={
            "field_name": "Liability Cap",
            "field_description": "Maximum liability amount",
            "data_type": "string"
        })

        # 3. Mock Extraction to verify it received the custom field
        mock_data = [{"field_name": "Liability Cap", "value": "1M USD", "confidence": 0.9}]

        def mock_extract(text, fields):
            # Assert that "Liability Cap" is in the requested fields
            field_names = [f["name"] for f in fields]
            assert "Liability Cap" in field_names
            assert "Contract Title" not in field_names # Should not use default if schema exists
            return mock_data

        with patch("app.extract_data_from_text", side_effect=mock_extract) as mock_func:
            res = client.post(f"/documents/{did}/extract")
            assert res.status_code == 200

            # 4. Verify Result
            records = res.json()
            assert len(records) == 1
            assert records[0]["field_name"] == "Liability Cap"

if __name__ == "__main__":
    try:
        test_dynamic_extraction()
        print("Dynamic extraction test passed!")
    except Exception as e:
        print(f"Test failed: {e}")
