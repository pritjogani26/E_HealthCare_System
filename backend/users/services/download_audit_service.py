import io
import pandas as pd
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet


COLUMNS = ["log_id", "action", "status", "performed_by", "target_user", "details", "timestamp"]
HEADERS = ["Log ID", "Action", "Status", "Performed By", "Target User", "Details", "Timestamp"]


def build_dataframe(data: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(data, columns=COLUMNS)
    df.columns = HEADERS
    return df.fillna("-")

def generate_csv(data: list[dict], filename: str) -> HttpResponse:
    buffer = io.StringIO()
    build_dataframe(data).to_csv(buffer, index=False)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
    print(f'attachment; filename="{filename}.csv"')
    return response
 



def generate_pdf(data: list[dict], filename: str) -> HttpResponse:
    df = build_dataframe(data)
    buffer = io.BytesIO()

    styles = getSampleStyleSheet()

    table_data = [df.columns.tolist()] + df.values.tolist()

    table_data = [
        [Paragraph(str(cell), styles["Normal"]) for cell in row]
        for row in table_data
    ]

    col_widths = [70, 80, 70, 120, 120, 250, 120]

    table = Table(table_data, colWidths=col_widths)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        title="Audit Log Report",
    )
    pdf.build([table])

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
    return response