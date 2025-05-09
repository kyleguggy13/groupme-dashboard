import pandas as pd
from shared import groupme, forbidden_users


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


df_usernames = df_users_unique

# Create dataframe for message count
# Convert to function
def count_messages(df):
    """
    Counts the number of messages per user in the given DataFrame.

    Parameters:
    df (pd.DataFrame): The DataFrame containing message data.

    Returns:
    pd.DataFrame: A DataFrame with user IDs and their corresponding message counts.
    """
    df_count = df['user_id'].value_counts().to_frame().reset_index()
    df_count.columns = ['user_id', 'message_count']
    return df_count


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
# Convert to function
def count_favorites(df):
    """
    Counts the number of favorites received per user in the given DataFrame.

    Parameters:
    df (pd.DataFrame): The DataFrame containing message data.

    Returns:
    pd.DataFrame: A DataFrame with user IDs and their corresponding favorite counts.
    """
    df_favorite_count = df.groupby('user_id')['favorite_count'].sum().sort_values(ascending=False).to_frame().reset_index()
    return df_favorite_count

df_favorite_count = df_message.groupby('user_id')['favorite_count'].sum().sort_values(ascending=False).to_frame().reset_index()
df_users_unique = df_users_unique.merge(df_favorite_count, on='user_id')


df_users_unique['Average Likes Per Message'] = df_users_unique['favorite_count'] / df_users_unique['message_count']


# Expand the 'event' column into separate columns
event_data = df_message_system['event'].apply(pd.Series)

events = event_data['type'].unique()

dict_events = {}
for event in events:
    df = df_message_system.loc[event_data['type'] == event].reset_index(drop=True)
    df_e = pd.json_normalize(df['event'])
    dict_events[event] = df.merge(df_e, left_index=True, right_index=True)



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
