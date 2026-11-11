import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).resolve().parent.parent/"client-update0212/build-upgrade.py"),run_name="__main__")
