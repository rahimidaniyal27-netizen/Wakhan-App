"""Package the current native 029 update; preserve the old source as build input only."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).resolve().parent.parent/"server-update029/build-upgrade.py"),run_name="__main__")
