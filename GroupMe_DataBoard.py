import os
import csv
import pandas as pd
from pathlib import PurePath
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.colors as mcolors
import matplotlib.ticker as ticker
from pandas.plotting import register_matplotlib_converters
import seaborn as sns


message = r"C:\Users\kyleg\OneDrive\Documents\Friend's Group Chat\GroupMe Export\00001\11739362\message.json"  
# conversation = r"C:\Users\kyleg\OneDrive\Documents\Friend's Group Chat\GroupMe Export\00001\11739362\conversation.json"
# likes_everyone = r"C:\Users\kyleg\OneDrive\Documents\Friend's Group Chat\GroupMe Export\00001\11739362\likes\everyone.json"
forbidden_users = r"C:\Users\kyleg\OneDrive\Documents\Friend's Group Chat\forbidden_user_ids.csv"



df_message = pd.read_json(message)
# df_conversation = pd.read_json(conversation)
# df_likes_everyone = pd.read_json(likes_everyone)
df_forbidden_users = pd.read_csv(forbidden_users)


df_message[['user_id', 'id']] = df_message[['user_id', 'id']].astype(str)
df_forbidden_users['user_id'] = df_forbidden_users['user_id'].astype(str)
forbidden_users = df_forbidden_users['user_id'].tolist()


# Remove forbidden users from dataframe
for x in forbidden_users:
    # Data = df_message.loc[df_message.loc[:,'user_id']!=x]
    df_message = df_message.loc[df_message.loc[:, 'user_id']!=x]


# Create dataframe for system messages
df_message_system = df_message.loc[df_message['user_id']=='system']

# Create dataframe for calender messages
df_message_calender = df_message.loc[df_message['user_id']=='calendar']

# Create dataframe for user messages
df_message = df_message.loc[df_message['user_id']!='system']
df_message = df_message.loc[df_message['user_id']!='calendar']

# Create dataframe for unique users
df_users_unique = pd.DataFrame(pd.unique(df_message['user_id']), columns=['user_id'])


# Add name column to df_users_unique
df_users_unique['name'] = 'Unknown'
for x in range(len(df_users_unique)):
    user_id = df_users_unique.loc[x,'user_id']
    name = df_message.loc[df_message['user_id']==user_id,'name'].iloc[0]
    df_users_unique.loc[x,'name'] = name

    
    
# Create dataframe for message count
df_message_count = df_message['user_id'].value_counts().to_frame().reset_index()
df_message_count.columns = ['user_id', 'message_count']
df_users_unique = df_users_unique.merge(df_message_count, on='user_id')
# df_message_count = df_message_count.merge(df_users_unique, on='user_id')

# Count of favorites received per message
df_message['favorite_count'] = df_message['favorited_by'].apply(lambda x: len(x))
df_message['favorite_count'].value_counts().sort_index()

# Sum of favorites received per user
df_favorite_count = df_message.groupby('user_id')['favorite_count'].sum().sort_values(ascending=False).to_frame().reset_index()
df_users_unique = df_users_unique.merge(df_favorite_count, on='user_id')


df_users_unique['Average Likes Per Message'] = df_users_unique['favorite_count'] / df_users_unique['message_count']


def export_to_csv(df, file_path):
    """
    Exports the given DataFrame to a CSV file.

    Parameters:
    df (pd.DataFrame): The DataFrame to export.
    file_path (str): The file path where the CSV will be saved.
    """
    try:
        df.to_csv(file_path, index=False, encoding='utf-8')
        print(f"DataFrame successfully exported to {file_path}")
    except Exception as e:
        print(f"An error occurred while exporting the DataFrame: {e}")

# Example usage
# export_to_csv(df_message, r"C:\Users\kyleg\OneDrive\Python\GroupMe DataBoard\exported_messages.csv")

 
### MATPLOTLIB PLOT ###
def PlotImage(DateRange): # DateRange is a list of dates

    fig = plt.figure(figsize=(40,16))
    ax = fig.add_subplot(111)


    for x in DateRange:
        dates = df_message.loc[df_message['ceated_at']==x]
        
        dateMAX = dates['boiler 1 (pph)'].max()
        dateMAXrow = dates.loc[dates['boiler 1 (pph)']==dateMAX]
        
        dateMIN = dates['boiler 1 (pph)'].min()
        dateMINrow = dates.loc[dates['boiler 1 (pph)']==dateMIN]


        if (x % 2) == 0:
            rgb_B1 = 'red'
            rgb_B2 = 'indigo'
            rgb_B3 = 'lime'
        else:
            rgb_B1 = 'darkorange'
            rgb_B2 = 'blue'
            rgb_B3 = 'green'
        
        ax.scatter(dates['Date/Time'],dates['boiler 1 (pph)'], s=1, c=rgb_B1, label='boiler 1 (pph)')
        ax.scatter(dates['Date/Time'],dates['boiler 2 (pph)'], s=1, c=rgb_B2, label='boiler 2 (pph)')
        ax.scatter(dates['Date/Time'],dates['boiler 3 (pph)'], s=1, c=rgb_B3, label='boiler 3 (pph)')
        ax.scatter(dateMAXrow['Date/Time'], dateMAXrow['boiler 1 (pph)'], s=20, c='magenta', label='MAX: boiler 1 (pph)')
        ax.scatter(dateMINrow['Date/Time'], dateMINrow['boiler 1 (pph)'], s=20, c='magenta', label='MIN: boiler 1 (pph)')


    labelList = ['boiler 1 (pph): orange','boiler 2 (pph): blue','boiler 3 (pph): green','MAX Per Day (boiler 1): magenta',
                 'MIN Per Day (boiler 1): magenta','boiler 1 (pph): red','boiler 2 (pph): indigo','boiler 3 (pph): lime']


    # ax.scatter(df_Data['Date/Time'],MAX, s=3, c='b', label='MAX')
    # ax.scatter(df_Data['Date/Time'],MIN, s=3, c='b', label='MIN')
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=2))
    ax.xaxis.set_minor_locator(mdates.DayLocator())
    ax.yaxis.set_major_locator(ticker.MultipleLocator(200))
    ax.grid(True)
    ax.set_ylabel('pph')
    ax.set_ylim(bottom=0)

    ax.legend(labels=labelList, loc='upper left')


    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    # fig.autofmt_xdate(rotation=45)

    image_val = fig.autofmt_xdate(rotation=45)

    return image_val


# DateRangeAll = PlotImage(df_message)


### SEABORN PLOT ###
def seabornplot(df_data):
    sns.set_theme(style="whitegrid")

    # Initialize the matplotlib figure
    f, ax = plt.subplots(figsize=(6,15))

    # Plot the messages
    sns.set_color_codes("pastel")
    sns.barplot(x="message_count", y="name", data=df_data, label="Messages", color="b")

    # Plot the favorites
    sns.set_color_codes("muted")
    sns.barplot(x="favorite_count", y="name", data=df_data, label="Favorites", color="b", width=0.25)

    # Add a legend, informative axis label, and bar data labels
    ax.legend(ncol=2, loc="lower right", frameon=True)
    ax.bar_label(ax.containers[0], fmt="{:,.0f}", label_type='edge')
    # ax.bar_label(ax.containers[1], fmt="{:,.0f}")
    ax.set(ylabel="", xlabel="Messages and Favorites")
    sns.despine(left=True, bottom=True)


# seabornplot(df_users_unique)


### SEABORN EXAMPLE ###
def seaborn_example():
    import seaborn as sns
    import matplotlib.pyplot as plt
    sns.set_theme(style="whitegrid")

    # Initialize the matplotlib figure
    f, ax = plt.subplots(figsize=(6, 15))

    # Load the example car crash dataset
    crashes = sns.load_dataset("car_crashes").sort_values("total", ascending=False)

    # Plot the total crashes
    sns.set_color_codes("pastel")
    sns.barplot(x="total", y="abbrev", data=crashes,
                label="Total", color="b")

    # Plot the crashes where alcohol was involved
    sns.set_color_codes("muted")
    sns.barplot(x="alcohol", y="abbrev", data=crashes,
                label="Alcohol-involved", color="b")

    # Add a legend and informative axis label
    ax.legend(ncol=2, loc="lower right", frameon=True)
    ax.set(xlim=(0, 24), ylabel="",
        xlabel="Automobile collisions per billion miles")
    sns.despine(left=True, bottom=True)