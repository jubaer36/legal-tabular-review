from fastapi.testclient import TestClient
from app import app
from unittest.mock import patch
import pytest

def test_evaluation_flow():
    with TestClient(app) as client:
        # 1. Setup
        p = client.post("/projects", json={"name": "EvalProject", "description": ""}).json()
        pid = p["id"]

        # 2. Ingest
        files = client.get("/files").json()
        if not files: pytest.skip("No files")
        d = client.post(f"/projects/{pid}/ingest", json={"filename": files[0]}).json()
        did = d["id"]

        # 3. Mock Extract
        mock_data = [
            {"field_name": "F1", "value": "A", "confidence": 0.9},
            {"field_name": "F2", "value": "B", "confidence": 0.9}
        ]
        with patch("app.extract_data_from_text", return_value=mock_data):
            client.post(f"/documents/{did}/extract")

        records = client.get(f"/documents/{did}/records").json()
        # Sort by field name to ensure r1 is F1
        records.sort(key=lambda x: x["field_name"])
        r1 = records[0]
        r2 = records[1]

        # 4. Review Records
        # R1: Approved (Correct) - Value matches AI Value
        client.put(f"/records/{r1['id']}", json={"value": "A", "status": "approved"})

        # R2: Updated (Incorrect AI) - Value changed from B to C
        client.put(f"/records/{r2['id']}", json={"value": "C", "status": "manual_updated"})

        # 5. Check Evaluation
        eval_res = client.get(f"/projects/{pid}/evaluation").json()
        print(f"Eval Result: {eval_res}")

        assert eval_res["total_fields"] == 2
        assert eval_res["reviewed_fields"] == 2
        assert eval_res["correct_fields"] == 1
        assert eval_res["accuracy"] == 50.0

if __name__ == "__main__":
    try:
        test_evaluation_flow()
        print("Evaluation flow test passed!")
    except Exception as e:
        print(f"Test failed: {e}")
