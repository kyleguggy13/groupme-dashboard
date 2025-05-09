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
                data_columns = ["name", "user_id", "message_count", "favorite_count", "Average Likes Per Message"]
                return df_users_unique[data_columns]
            

with ui.nav_panel("Page 2"):
    "Group Name list to come."
    with ui.navset_card_underline(title="Group Names"):
        with ui.nav_panel("Table"):

            @render.data_frame
            def data_groupnames():
                df_GroupNames = dict_events['group.name_change']
                df_GroupNames['days_ago'] = (pd.to_datetime("now") - pd.to_datetime(df_GroupNames["created_at"])).dt.days
                
                for i in range(len(df_GroupNames['days_ago'])):
                    # Calculate days_active based on the difference between the current and previous days_ago values
                    if i == 0:
                        days_active = df_GroupNames['days_ago'][i]
                        # print(f"days_active: {days_active}")
                    else:
                        days_active = df_GroupNames['days_ago'][i] - df_GroupNames['days_ago'][i-1]
                        # print(f"days_active: {days_active}")
                    
                    df_GroupNames.loc[i, 'days_active'] = days_active

                    data_columns = ["created_at", "days_ago", "days_active", "data.name", "data.user.nickname"]

                return df_GroupNames[data_columns].sort_values(by="created_at", ascending=False)

# with ui.nav_panel("Page 3"):
#     with ui.navset_card_underline(title="User Metrics"):
#         with ui.nav_panel("Plot"):
#             @render.plot
#             def plot_user_metrics():
#                 # Create a bar plot of the number of messages sent per year
#                 df_message["created_at"] = pd.to_datetime(df_message["created_at"])
#                 df_message["year"] = df_message["created_at"].dt.year

#                 # p = sns.barplot(
#                 #     data=df_message['user_id'] == 
#                 #     x="year",
#                 #     y="message_count",
#                 #     palette="Set2",
#                 #     dodge=True,
#                 # )
#                 return p
