import os, tempfile, sys
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/t.db"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
