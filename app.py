import faicons as fa
import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt 

# Load data and compute static values
from shared import app_dir, groupme
from shiny.express import input, render, ui
from GroupMe_DataBoard import df_message, df_users_unique, dict_events


### Page title
ui.page_opts(title="GroupMe DataBoard")

### Push the navbar items to the right
ui.nav_spacer()

### Select variable to display
footer = ui.input_select(
    "var", "Select variable", choices=["message_count", "favorite_count"], multiple=True, selected=["message_count"]
)


with ui.nav_panel("Page 1"):
    with ui.navset_card_underline(title="Messages and Favorites", footer=footer):
        with ui.nav_panel("Plot"):

            @render.plot
            def hist():
                # p = sns.barplot(
                #     df_users_unique, 
                #     x=input.var(), 
                #     y="name", 
                #     orient="h", 
                #     facecolor="#007bc2", 
                #     edgecolor="white")
                first = input.var()[0]
                second = input.var()[1] if len(input.var()) > 1 else None
                
                if len(input.var()) == 1:
                    pp = df_users_unique.plot(x="name", y=first, kind="barh")
                else:
                    pp = df_users_unique.plot(x="name", y=[first, second], kind="barh")
                
                return pp
            
        with ui.nav_panel("Table"):

            @render.data_frame
            def data():
                df_users_unique["Average Likes Per Message"] = df_users_unique["Average Likes Per Message"].round(2)
                return df_users_unique[["name", "user_id", "message_count", "favorite_count", "Average Likes Per Message"]]
            

with ui.nav_panel("Page 2"):
    "Group Name list to come."
    with ui.navset_card_underline(title="Group Names", footer=footer):
        with ui.nav_panel("Table"):

            @render.data_frame
            def data():
                df_GroupNames = dict_events['group.name_change']

                return df_GroupNames[["created_at", "data.name", "data.user.nickname"]].sort_values(by="created_at", ascending=False)
