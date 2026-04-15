# backend\users\services\download_audit_service.py
import io
import pandas as pd
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet


COLUMNS = [
    "audit_id",
    "user_id",
    "user_email",
    "targeted_user_id",
    "targeted_user_email",
    "table_name",
    "row_id",
    "action",
    "status",
    "old_data",
    "new_data",
    "failure_reason",
    "ip_address",
    "user_agent",
    "created_at",
]
HEADERS = [
    "Audit ID",
    "User ID",
    "User Email",
    "Targeted User ID",
    "Target User Email",
    "Table",
    "Row ID",
    "Action",
    "Status",
    "Old Data",
    "New Data",
    "Failure Reason",
    "IP Address",
    "User Agent",
    "Created At",
]


def build_dataframe(data: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(data, columns=COLUMNS)
    df.columns = HEADERS
    return df.fillna("-")


def generate_csv(data: list[dict], filename: str) -> HttpResponse:
    buffer = io.StringIO()
    build_dataframe(data).to_csv(buffer, index=False)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
    return response


def generate_pdf(data: list[dict], filename: str) -> HttpResponse:
    df = build_dataframe(data)
    buffer = io.BytesIO()

    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]
    normal_style.wordWrap = "CJK"  # Help wrap long strings without spaces like UUIDs

    def truncateText(text, max_len=150):
        t = str(text)
        return t if len(t) <= max_len else t[:max_len] + "..."

    table_data = [df.columns.tolist()] + df.values.tolist()

    table_data = [
        [Paragraph(truncateText(cell), normal_style) for cell in row]
        for row in table_data
    ]

    # total width ~ 800 for A4 landscape
    col_widths = [
        35,  # Audit ID
        50,  # User ID
        70,  # User Email
        50,  # Targeted User ID
        70,  # Target User Email
        45,  # Table Name
        35,  # Row ID
        40,  # Action
        45,  # Status
        70,  # Old Data
        70,  # New Data
        60,  # Failure Reason
        55,  # IP Address
        55,  # User Agent
        60,  # Created At
    ]

    table = Table(table_data, colWidths=col_widths)

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),  # TOP alignment is better for multi-line
                ("FONTSIZE", (0, 0), (-1, -1), 7),  # Smaller font to fit more data
            ]
        )
    )

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        title="Audit Log Report",
        leftMargin=20,
        rightMargin=20,
        topMargin=20,
        bottomMargin=20,
    )
    pdf.build([table])

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
    return response
