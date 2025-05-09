import faicons as fa
import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt 

# Load data and compute static values
from shared import app_dir, groupme
from shiny.express import input, render, ui
from GroupMe_DataBoard import df_message, df_users_unique, dict_events, df_usernames, count_messages, count_favorites


### Page title
ui.page_opts(title="GroupMe DataBoard")

### Push the navbar items to the right
ui.nav_spacer()
startdate = str(pd.to_datetime(df_message["created_at"].min()).date())
enddate = str(pd.to_datetime(df_message["created_at"].max()).date())
header =  ui.input_date_range("daterange", "Date Range", start=startdate, end=enddate)

### Select variable to display
footer = ui.input_select(
    "var", "Select variable", choices=["message_count", "favorite_count"], multiple=True, selected=["message_count"]
)


with ui.nav_panel("Page 1"):
    # ui.input_date_range("daterange", "Date Range")
    with ui.navset_card_underline(title="Messages and Favorites", header=header, footer=footer):
        with ui.nav_panel("Plot"):

            @render.plot
            def hist():
                date1 = str(input.daterange()[0])
                date2 = str(input.daterange()[1])

                print(f"Date range: {date1} to {date2}")
                print(type(date1), type(date2))

                df_message_filtered = df_message.loc[(df_message['created_at'] >= date1) & (df_message['created_at'] <= date2)]

                df_count = df_usernames.merge(count_messages(df_message_filtered))

                df_count = df_count.merge(count_favorites(df_message_filtered))
                df_count['Average Likes Per Message'] = df_count['favorite_count'] / df_count['message_count']


                # df_count = df_message_filtered['user_id'].value_counts().to_frame().reset_index()
                # df_count.columns = ['user_id', 'message_count']
                # df_plot = df_usernames.merge(df_count, on='user_id')


                first = input.var()[0]
                second = input.var()[1] if len(input.var()) > 1 else None
                
                if len(input.var()) == 1:
                    pp = df_count.plot(x="name", y=first, kind="barh")
                else:
                    pp = df_count.plot(x="name", y=[first, second], kind="barh")
                
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
