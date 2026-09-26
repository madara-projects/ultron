import json

from backend.tests.api_samples import SAMPLES_FILE, build_samples


def test_frontend_test_data_matches_the_api():
    committed = json.loads(SAMPLES_FILE.read_text(encoding="utf-8"))
    assert committed == build_samples(), (
        "frontend/src/test/api-samples.json is out of date; regenerate it (see backend/tests/api_samples.py)"
    )
