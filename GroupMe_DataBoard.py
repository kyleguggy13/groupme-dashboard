import pandas as pd
from pathlib import PurePath
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.colors as mcolors
import matplotlib.ticker as ticker
from pandas.plotting import register_matplotlib_converters
import seaborn as sns
from shared import app_dir, groupme, forbidden_users


df_message = groupme
df_forbidden_users = forbidden_users



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


# Count of favorites received per message
import ast
# Convert the string to a Python list safely
df_message['favorited_by'] = df_message['favorited_by'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)
# Now count properly
df_message['favorite_count'] = df_message['favorited_by'].apply(lambda x: len(x))


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
