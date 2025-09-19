import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parents[1]
SCRIPT = REPO_ROOT / "crypto_price_tracker.py"
OUT = REPO_ROOT / "out_test"
OUT.mkdir(exist_ok=True)

def test_cli_offline_runs_and_writes_outputs(tmp_path):
    input_file = REPO_ROOT / "tests" / "fixtures" / "sample_holdings.csv"
    # Convert CSV to xlsx so the tool reads it (tool expects Excel). We'll call pandas in a tiny helper python -c.
    code = (
        "import pandas as pd; "
        f"df = pd.read_csv(r'{input_file}'); "
        f"df.to_excel(r'{tmp_path/'input.xlsx'}', index=False)"
    )
    subprocess.check_call([sys.executable, "-c", code])

    # Run the tracker in offline mode
    out_xlsx = tmp_path / "Updated_input.xlsx"
    cmd = [
        sys.executable, str(SCRIPT),
        "--input", str(tmp_path / "input.xlsx"),
        "--output", str(out_xlsx),
        "--offline",
        "--csv"
    ]
    subprocess.check_call(cmd)

    # Assert outputs exist
    assert out_xlsx.exists()
    assert out_xlsx.with_suffix(".csv").exists()
