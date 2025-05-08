from pathlib import Path
import numpy as np
import pandas as pd
import ast


def parse_dict(x):
    try:
        return ast.literal_eval(x)
    except (ValueError, SyntaxError):
        return x


app_dir = Path(__file__).parent
groupme = pd.read_csv(app_dir / "exported_messages.csv", converters={"event": parse_dict})
forbidden_users = pd.read_csv(app_dir / "forbidden_user_ids.csv")

def show_values(axs, orient="v", space=.01):
    def _single(ax):
        if orient == "v":
            for p in ax.patches:
                _x = p.get_x() + p.get_width() / 2
                _y = p.get_y() + p.get_height() + (p.get_height()*0.01)
                value = '{:.1f}'.format(p.get_height())
                ax.text(_x, _y, value, ha="center") 
        elif orient == "h":
            for p in ax.patches:
                _x = p.get_x() + p.get_width() + float(space)
                _y = p.get_y() + p.get_height() - (p.get_height()*0.25)
                value = '{:.1f}'.format(p.get_width())
                ax.text(_x, _y, value, ha="left")

    if isinstance(axs, np.ndarray):
        for idx, ax in np.ndenumerate(axs):
            _single(ax)
    else:
        _single(axs)