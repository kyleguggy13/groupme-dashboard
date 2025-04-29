from pathlib import Path

import pandas as pd

app_dir = Path(__file__).parent
tips = pd.read_csv(app_dir / "tips.csv")


# app_dir2 = Path(__file__).parent
groupme = pd.read_csv(app_dir / "exported_messages.csv")
