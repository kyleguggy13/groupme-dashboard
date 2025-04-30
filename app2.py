from shiny import App, ui, render, reactive
import pandas as pd
import plotly.express as px

# Load and preprocess data
df = pd.read_csv(r"C:\Users\kyleg\OneDrive\Python\GroupMe DataBoard\exported_messages.csv")
df["favorite_count"] = pd.to_numeric(df["favorite_count"], errors="coerce")
df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

# Define the summary function
def get_summary(data):
    summary = data.groupby("name", as_index=False).agg(
        total_messages=("id", "count"),
        total_favorites=("favorite_count", "sum")
    )
    summary.dropna(subset=["name"], inplace=True)
    return summary

# UI
app_ui = ui.page_fluid(
    ui.h2("GroupMe Messages: User Activity Dashboard"),
    
    ui.input_date_range(
        "date_range",
        "Filter by Date Range",
        start=df["created_at"].min().date(),
        end=df["created_at"].max().date()
    ),
    
    ui.input_selectize(
        "selected_users",
        "Select Users",
        choices=list(df["name"].dropna().unique()),
        multiple=True,
        selected=list(df["name"].dropna().unique())[:5]
    ),
    
    ui.output_plot("user_bar_chart"),
    ui.output_table("user_table")
)

# Server
def server(input, output, session):

    @reactive.calc
    def filtered_data():
        # Filter by date range
        mask = (df["created_at"].dt.date >= input.date_range()[0]) & \
               (df["created_at"].dt.date <= input.date_range()[1])
        return df[mask]

    @reactive.calc
    def filtered_summary():
        data = filtered_data()
        selected = input.selected_users()
        filtered = data[data["name"].isin(selected)] if selected else data.iloc[0:0]
        return get_summary(filtered)

    @output
    @render.plot
    def user_bar_chart():
        df_melted = filtered_summary().melt(
            id_vars="name", 
            value_vars=["total_messages", "total_favorites"],
            var_name="Metric", value_name="Count"
        )
        fig = px.bar(df_melted, x="name", y="Count", color="Metric", barmode="group",
                     title="Messages and Favorites per User")
        fig.update_layout(xaxis_title="User", yaxis_title="Count")
        return fig

    @output
    @render.table
    def user_table():
        return filtered_summary()

# Run the app
app = App(app_ui, server)
