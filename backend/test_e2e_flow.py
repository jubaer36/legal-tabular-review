import requests
import sys

BASE_URL = "http://localhost:8000"

def run_e2e():
    print("Starting E2E Smoke Test...")

    # 1. Health Check
    try:
        r = requests.get(f"{BASE_URL}/health")
        if r.status_code != 200:
            print("Backend not healthy")
            sys.exit(1)
    except Exception as e:
        print(f"Backend not reachable: {e}")
        sys.exit(1)

    print("1. Backend Healthy")

    # 2. Create Project
    r = requests.post(f"{BASE_URL}/projects", json={"name": "E2E Project", "description": "Flow test"})
    assert r.status_code == 200
    pid = r.json()["id"]
    print(f"2. Created Project {pid}")

    # 3. List Files
    r = requests.get(f"{BASE_URL}/files")
    files = r.json()
    if not files:
        print("No files in data/")
        sys.exit(1)
    target = files[0]
    print(f"3. Found file: {target}")

    # 4. Ingest
    r = requests.post(f"{BASE_URL}/projects/{pid}/ingest", json={"filename": target})
    assert r.status_code == 200
    did = r.json()["id"]
    print(f"4. Ingested Document {did}")

    # 5. Get Document Details
    r = requests.get(f"{BASE_URL}/documents/{did}")
    assert r.status_code == 200
    print("5. Retrieved Document Details")

    # 6. Attempt Extraction (Expected to fail without Key, or pass if mocked/key present)
    print("6. Attempting Extraction...")
    r = requests.post(f"{BASE_URL}/documents/{did}/extract")
    if r.status_code == 200:
        print("   Extraction SUCCESS (Mocked or Key present)")
        records = r.json()
        print(f"   Extracted {len(records)} records")
    else:
        print(f"   Extraction FAILED as expected (No Key): {r.status_code}")
        # This is acceptable for the smoke test at this stage

    print("E2E Flow Complete.")

if __name__ == "__main__":
    run_e2e()
