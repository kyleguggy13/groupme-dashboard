import faicons as fa
import plotly.express as px
import pandas as pd

# Load data and compute static values
from shared import app_dir, tips, groupme
from shiny import reactive, render
from shiny.express import input, ui
from shinywidgets import render_plotly
# from GroupMe_DataBoard import df_message, df_users_unique


bill_rng = (min(tips.total_bill), max(tips.total_bill))

df_dates = pd.DataFrame(groupme['created_at'])
df_dates['created_at'] = pd.to_datetime(df_dates['created_at']).dt.date
date_rng = (df_dates['created_at'].min(), df_dates['created_at'].max())
# --------------------------------------------------------


# Add page title and sidebar
ui.page_opts(title="GroupMe", fillable=True)

with ui.sidebar(open="desktop"):
    ui.input_slider(
        "total_bill",
        "Date Range",
        min=date_rng[0],
        max=date_rng[1],
        value=date_rng
    )
    ui.input_checkbox_group(
        "time",
        "Graphed Elements",
        ["Messages", "Likes"],
        selected=["Messages", "Likes"],
        inline=True,
    )
    ui.input_action_button("reset", "Reset filter")

# Add main content
ICONS = {
    "user": fa.icon_svg("user", "regular"),
    "wallet": fa.icon_svg("wallet"),
    "currency-dollar": fa.icon_svg("dollar-sign"),
    "ellipsis": fa.icon_svg("ellipsis"),
}

with ui.layout_columns(fill=False):
    with ui.value_box(showcase=ICONS["user"]):
        "Total tippers"

        @render.express
        def total_tippers():
            tips_data().shape[0]
            

    with ui.value_box(showcase=ICONS["wallet"]):
        "Average tip"

        @render.express
        def average_tip():
            d = tips_data()
            if d.shape[0] > 0:
                perc = d.tip / d.total_bill
                f"{perc.mean():.1%}"

    with ui.value_box(showcase=ICONS["currency-dollar"]):
        "Average bill"

        @render.express
        def average_bill():
            d = tips_data()
            if d.shape[0] > 0:
                bill = d.total_bill.mean()
                f"${bill:.2f}"


with ui.layout_columns(col_widths=[6, 6, 12]):
    with ui.card(full_screen=True):
        ui.card_header("Tips data")

        @render.data_frame
        def table():
            return render.DataGrid(tips_data())

    with ui.card(full_screen=True):
        with ui.card_header(class_="d-flex justify-content-between align-items-center"):
            "Total bill vs tip"
            with ui.popover(title="Add a color variable", placement="top"):
                ICONS["ellipsis"]
                ui.input_radio_buttons(
                    "scatter_color",
                    None,
                    ["none", "sex", "smoker", "day", "time"],
                    inline=True,
                )

        @render_plotly
        def scatterplot():
            color = input.scatter_color()
            return px.scatter(
                tips_data(),
                x="total_bill",
                y="tip",
                color=None if color == "none" else color,
                trendline="lowess",
            )

    with ui.card(full_screen=True):
        with ui.card_header(class_="d-flex justify-content-between align-items-center"):
            "Tip percentages"
            with ui.popover(title="Add a color variable"):
                ICONS["ellipsis"]
                ui.input_radio_buttons(
                    "tip_perc_y",
                    "Split by:",
                    ["sex", "smoker", "day", "time"],
                    selected="day",
                    inline=True,
                )

        @render_plotly
        def tip_perc():
            from ridgeplot import ridgeplot

            dat = tips_data()
            dat["percent"] = dat.tip / dat.total_bill
            yvar = input.tip_perc_y()
            uvals = dat[yvar].unique()

            samples = [[dat.percent[dat[yvar] == val]] for val in uvals]

            plt = ridgeplot(
                samples=samples,
                labels=uvals,
                bandwidth=0.01,
                colorscale="viridis",
                colormode="row-index",
            )

            plt.update_layout(
                legend=dict(
                    orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5
                )
            )

            return plt


ui.include_css(app_dir / "styles.css")

# --------------------------------------------------------
# Reactive calculations and effects
# --------------------------------------------------------


@reactive.calc
def tips_data():
    bill = input.total_bill()
    idx1 = tips.total_bill.between(bill[0], bill[1])
    idx2 = tips.time.isin(input.time())
    return tips[idx1 & idx2]

@reactive.calc
def groupme_data():
    msg_total = input.groupme()
    msg_total = groupme.groupby("name").agg(
        message_count=("message_count", "sum"),
        favorite_count=("favorite_count", "sum"),
    ).reset_index()
    return msg_total


@reactive.effect
@reactive.event(input.reset)
def _():
    ui.update_slider("total_bill", value=date_rng)
    ui.update_checkbox_group("time", selected=["Messages", "Likes"])
