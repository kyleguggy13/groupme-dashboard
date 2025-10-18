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

### Select date range
startdate = str(pd.to_datetime(df_message["created_at"].min()).date())
enddate = str(pd.to_datetime(df_message["created_at"].max()).date())
header =  ui.input_date_range("daterange", "Date Range", start=startdate, end=enddate)




### Select variable to display
footer = ui.input_select(
    "var", "Select variable", choices=["message_count", "favorite_count"], multiple=True, selected=["message_count", "favorite_count"]
)


with ui.nav_panel("Msg & Fav"):
    with ui.navset_card_underline(title="Messages and Favorites", header=header, footer=footer):
        with ui.nav_panel("Plot"):

            @render.plot
            def hist():
                date1 = str(input.daterange()[0])
                date2 = str(input.daterange()[1])

                # print(f"Date range: {date1} to {date2}")
                # print(type(date1), type(date2))

                df_message_filtered = df_message.loc[(df_message['created_at'] >= date1) & (df_message['created_at'] <= date2)]

                df_count = df_usernames.merge(count_messages(df_message_filtered))

                df_count = df_count.merge(count_favorites(df_message_filtered))
                df_count['Average Likes Per Message'] = df_count['favorite_count'] / df_count['message_count']


                first = input.var()[0]
                second = input.var()[1] if len(input.var()) > 1 else None
                
                if len(input.var()) == 1:
                    pp = df_count.plot(x="name", y=first, kind="barh")
                else:
                    pp = df_count.plot(x="name", y=[first, second], kind="barh",)
                
                pp.grid(axis='x', linestyle='--', linewidth=0.5, color='gray')
                
                return pp
            
        with ui.nav_panel("Table"):

            @render.data_frame
            def data():
                date1 = str(input.daterange_avg()[0])
                date2 = str(input.daterange_avg()[1])

                df_message_filtered = df_message.loc[(df_message['created_at'] >= date1) & (df_message['created_at'] <= date2)]

                df_count = df_usernames.merge(count_messages(df_message_filtered))

                df_count = df_count.merge(count_favorites(df_message_filtered))
                df_count['Average Likes Per Message'] = df_count['favorite_count'] / df_count['message_count']

                df_users_unique["Average Likes Per Message"] = df_count["Average Likes Per Message"].round(2)
                df_users_unique['message_count'] = df_count['message_count']
                df_users_unique['favorite_count'] = df_count['favorite_count']
                data_columns = ["name", "user_id", "message_count", "favorite_count", "Average Likes Per Message"]
                return df_users_unique[data_columns]


with ui.nav_panel("Averages"):
    with ui.navset_card_underline(title="Average Messages and Favorites", header=header):
        with ui.nav_panel("Plot"):

            @render.plot
            def avg_plot():
                # Parse date range from input and ensure datetimes
                date1 = pd.to_datetime(input.daterange()[0])
                date2 = pd.to_datetime(input.daterange()[1])

                # Copy and ensure created_at is datetime
                df = df_message.copy()
                df['created_at'] = pd.to_datetime(df['created_at'])

                # Filter by selected date range
                df = df.loc[(df['created_at'] >= date1) & (df['created_at'] <= date2)]

                # Handle empty data
                if df.empty:
                    fig, ax = plt.subplots()
                    ax.text(0.5, 0.5, "No data for selected date range", ha="center", va="center")
                    ax.axis("off")
                    return fig

                # Group by month and user, pivot so each user is a column
                df['month'] = df['created_at'].dt.to_period('M').dt.to_timestamp()
                df_counts = df.groupby(['month', 'user_id']).size().reset_index(name='message_count')
                df_pivot = df_counts.pivot(index='month', columns='user_id', values='message_count').fillna(0)

                # Map user_id to display names using df_usernames
                if 'user_id' in df_usernames.columns and 'name' in df_usernames.columns:
                    id_to_name = df_usernames.set_index('user_id')['name'].to_dict()
                    df_pivot.rename(columns=id_to_name, inplace=True)

                # Plot lines for each user
                fig, ax = plt.subplots(figsize=(10, 6))
                df_pivot.plot(ax=ax, marker='o', linewidth=1)

                ax.set_xlabel("Month")
                ax.set_ylabel("Messages")
                ax.set_title("Messages per Month by User")
                ax.grid(axis='y', linestyle='--', linewidth=0.5, color='gray')
                ax.legend(title="User", bbox_to_anchor=(1.02, 1), loc="upper left")
                fig.autofmt_xdate()
                plt.tight_layout()

                return fig 


with ui.nav_panel("Group Names"):
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
                    # df_GroupNames[data_columns].sort_values(by="created_at", ascending=False)
                return render.DataTable(df_GroupNames[data_columns], width="100%",)

with ui.nav_panel("The Years"):
    with ui.navset_card_underline(title="Yearly Metrics"):
        with ui.nav_panel("Plot"):
            @render.plot
            def plot_user_metrics():
                # Create a bar plot of the number of messages sent per year
                df_message["created_at"] = pd.to_datetime(df_message["created_at"])
                df_message["year"] = df_message["created_at"].dt.year

                df_years = df_message.groupby("year").size().reset_index(name="message_count")

                pp = df_years.plot(x="year", y="message_count", kind="bar")
                pp.bar_label(pp.containers[0])
                

                return pp
