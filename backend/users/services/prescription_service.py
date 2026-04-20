# backend/users/services/prescription_service.py

import os
import uuid
from datetime import date, datetime

from django.conf import settings


# ── Prescription-number helper ───────────────────────────────────────────────

def generate_prescription_number() -> str:
    """Returns a unique prescription number like  RX-20260417-A1B2C3"""
    today = date.today()
    suffix = str(uuid.uuid4()).replace("-", "")[:6].upper()
    return f"RX-{today.strftime('%Y%m%d')}-{suffix}"


# ── PDF generation ───────────────────────────────────────────────────────────

def generate_prescription_pdf(
    prescription: dict,
    doctor: dict,
    patient: dict,
    medicines: list[dict],
    appointment: dict,
) -> tuple[str, str]:
    """
    Builds the PDF and saves it to:
        MEDIA_ROOT/prescriptions/<doctor_id>/<filename>.pdf

    Returns:
        (absolute_path, relative_path_from_MEDIA_ROOT)
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle,
        Paragraph, Spacer, HRFlowable,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

    # ── directory & filename ─────────────────────────────────────────────────
    doctor_id = str(doctor.get("doctor_id", "unknown"))
    folder = os.path.join(settings.MEDIA_ROOT, "prescriptions", doctor_id)
    os.makedirs(folder, exist_ok=True)

    presc_num = prescription["prescription_number"].lower().replace("-", "_")
    presc_short = str(prescription["prescription_id"])[:8]
    filename = f"{presc_num}_{presc_short}_prescription.pdf"
    abs_path = os.path.join(folder, filename)
    rel_path = os.path.join("prescriptions", doctor_id, filename)

    # ── colour palette ───────────────────────────────────────────────────────
    NAVY   = colors.HexColor("#1a3c6e")
    BLUE2  = colors.HexColor("#2e5fa3")
    LGREY  = colors.HexColor("#f5f8fc")
    MGREY  = colors.HexColor("#d0dff0")
    DGREY  = colors.HexColor("#555555")
    GREEN  = colors.HexColor("#16a34a")
    WHITE  = colors.white

    # ── document ─────────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        abs_path,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )

    # ── styles ───────────────────────────────────────────────────────────────
    base = getSampleStyleSheet()

    def S(name, parent="Normal", **kw):
        s = ParagraphStyle(name, parent=base[parent], **kw)
        return s

    sTitle    = S("sTitle",    fontSize=18, textColor=WHITE,  fontName="Helvetica-Bold",
                  leading=22, spaceAfter=0)
    sSub      = S("sSub",      fontSize=9,  textColor=colors.HexColor("#b8d0f0"),
                  fontName="Helvetica", leading=13)
    sSection  = S("sSection",  fontSize=9,  textColor=NAVY,   fontName="Helvetica-Bold",
                  spaceBefore=4, spaceAfter=2)
    sBody     = S("sBody",     fontSize=8.5, textColor=DGREY, fontName="Helvetica",
                  leading=13)
    sBodyBold = S("sBodyBold", fontSize=8.5, textColor=NAVY,  fontName="Helvetica-Bold",
                  leading=13)
    sSmall    = S("sSmall",    fontSize=7.5, textColor=colors.HexColor("#9bb3cc"),
                  fontName="Helvetica", leading=11)
    sPrescRx  = S("sPrescRx",  fontSize=28, textColor=BLUE2,  fontName="Helvetica-Bold",
                  leading=32)
    sRight    = S("sRight",    fontSize=7.5, textColor=DGREY,  fontName="Helvetica",
                  alignment=TA_RIGHT, leading=11)

    story = []
    W = 182 * mm   # usable width

    # ─────────────────────────────────────────────────────────────────────────
    # HEADER BANNER
    # ─────────────────────────────────────────────────────────────────────────
    qualifications = ", ".join(
        [q.get("qualification_code", "") for q in doctor.get("qualifications", [])]
    )
    specializations = ", ".join(
        [s.get("specialization_name", "") for s in doctor.get("specializations", [])]
    )
    _raw_name   = doctor.get("full_name", "Doctor")
    # Strip any existing "Dr." / "Dr " prefix stored in the DB
    # so we never render "Dr. Dr. Patel".
    _stripped   = _raw_name.strip()
    if _stripped.lower().startswith("dr."):
        _stripped = _stripped[3:].strip()
    elif _stripped.lower().startswith("dr "):
        _stripped = _stripped[3:].strip()
    doctor_name = _stripped or _raw_name
    reg_number  = doctor.get("registration_number", "—")
    clinic_phone = doctor.get("phone_number", "—")
    clinic_email = doctor.get("email", "—")

    header_data = [[
        Paragraph(
            f"Dr. {doctor_name}"
            + (f"<br/><font size='8'>{qualifications}</font>" if qualifications else "")
            + (f"<br/><font size='7.5' color='#b8d0f0'>{specializations}</font>" if specializations else ""),
            sTitle,
        ),
        Paragraph(
            f"Reg. No: {reg_number}<br/>"
            f"📞 {clinic_phone}<br/>"
            f"✉ {clinic_email}",
            sSub,
        ),
    ]]
    header_tbl = Table(header_data, colWidths=[W * 0.6, W * 0.4])
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), NAVY),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, -1),  10),
        ("RIGHTPADDING",(1, 0), (1, -1),  10),
        ("TOPPADDING",  (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",(0, 0),(-1, -1), 10),
        ("ALIGN",       (1, 0), (1, -1),  "RIGHT"),
        ("ROWBACKGROUNDS",(0,0),(-1,-1), [NAVY]),
    ]))
    story.append(header_tbl)

    # ── date strip ───────────────────────────────────────────────────────────
    today_str = datetime.now().strftime("%d %B %Y")
    date_data = [[
        Paragraph(prescription["prescription_number"], sBodyBold),
        Paragraph(today_str, sRight),
    ]]
    date_tbl = Table(date_data, colWidths=[W * 0.5, W * 0.5])
    date_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), LGREY),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (0, -1),  8),
        ("RIGHTPADDING", (1, 0), (1, -1),  8),
        ("BOX",          (0, 0), (-1, -1), 0.5, MGREY),
    ]))
    story.append(date_tbl)
    story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # PATIENT  +  APPOINTMENT  (two-column row)
    # ─────────────────────────────────────────────────────────────────────────
    patient_name = patient.get("full_name", "—")
    dob          = patient.get("date_of_birth")
    age_str = ""
    if dob:
        try:
            if isinstance(dob, str):
                dob = datetime.strptime(dob, "%Y-%m-%d").date()
            age_str = f"{(date.today() - dob).days // 365} yrs"
        except Exception:
            pass
    gender     = patient.get("gender", "—")
    mobile     = patient.get("mobile", "—")
    blood_grp  = patient.get("blood_group", "")

    slot_date  = str(appointment.get("slot_date", "—"))
    start_time = str(appointment.get("start_time", "—"))
    apt_type   = appointment.get("appointment_type", "in_person")
    apt_type_s = "In-Person" if apt_type == "in_person" else "Online"
    apt_id     = str(appointment.get("appointment_id", "—"))

    def info_block(label, value):
        return Paragraph(
            f"<font color='#9bb3cc'>{label}:</font>  <b>{value or '—'}</b>",
            sBody,
        )

    patient_inner = [
        [Paragraph("PATIENT", sSection)],
        [info_block("Name", patient_name)],
        [info_block("Age / Gender", f"{age_str}  {gender}")],
        [info_block("Mobile", mobile)],
        [info_block("Blood Group", blood_grp)],
    ]
    appt_inner = [
        [Paragraph("APPOINTMENT", sSection)],
        [info_block("ID", f"#{apt_id}")],
        [info_block("Date", slot_date)],
        [info_block("Time", start_time)],
        [info_block("Type", apt_type_s)],
    ]

    def make_card(inner_data, col_w):
        t = Table(inner_data, colWidths=[col_w])
        t.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), WHITE),
            ("BOX",          (0, 0), (-1, -1), 0.5, MGREY),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("BACKGROUND",   (0, 0), (0, 0),   LGREY),
        ]))
        return t

    CW = W * 0.485
    info_row = Table(
        [[make_card(patient_inner, CW), make_card(appt_inner, CW)]],
        colWidths=[CW + 2 * mm, CW],
    )
    info_row.setStyle(TableStyle([
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(info_row)
    story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # CLINICAL NOTES
    # ─────────────────────────────────────────────────────────────────────────
    if prescription.get("clinical_notes"):
        story.append(Paragraph("CLINICAL NOTES", sSection))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MGREY, spaceAfter=3))
        story.append(Paragraph(prescription["clinical_notes"].replace("\n", "<br/>"), sBody))
        story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # PRESCRIPTION  (Rx)
    # ─────────────────────────────────────────────────────────────────────────
    if medicines:
        rx_label = Table([[Paragraph("℞", sPrescRx)]], colWidths=[W])
        rx_label.setStyle(TableStyle([
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 2),
        ]))
        story.append(rx_label)

        FREQ_LABELS = {
            "once_daily":       "Once daily",
            "twice_daily":      "Twice daily",
            "thrice_daily":     "Thrice daily",
            "four_times_daily": "Four times daily",
            "as_needed":        "As needed",
            "at_bedtime":       "At bedtime",
        }
        INST_LABELS = {
            "after_food":    "After food",
            "before_food":   "Before food",
            "with_food":     "With food",
            "empty_stomach": "Empty stomach",
            "at_bedtime":    "At bedtime",
            "with_water":    "With water",
        }

        med_header = [
            Paragraph("<b>Medicine</b>",    sBodyBold),
            Paragraph("<b>Dosage</b>",      sBodyBold),
            Paragraph("<b>Frequency</b>",   sBodyBold),
            Paragraph("<b>Duration</b>",    sBodyBold),
            Paragraph("<b>Instructions</b>",sBodyBold),
        ]
        med_rows = [med_header]
        for m in medicines:
            freq = FREQ_LABELS.get(m.get("frequency", ""), m.get("frequency", "—") or "—")
            inst = INST_LABELS.get(m.get("instructions", ""), m.get("instructions", "—") or "—")
            med_rows.append([
                Paragraph(m.get("medicine_name", "—"), sBody),
                Paragraph(m.get("dosage", "—") or "—", sBody),
                Paragraph(freq, sBody),
                Paragraph(m.get("duration", "—") or "—", sBody),
                Paragraph(inst, sBody),
            ])

        med_tbl = Table(
            med_rows,
            colWidths=[W * 0.30, W * 0.14, W * 0.19, W * 0.16, W * 0.21],
        )
        med_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  NAVY),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
            ("ROWBACKGROUNDS",(0, 1),(-1, -1), [WHITE, LGREY]),
            ("BOX",          (0, 0), (-1, -1), 0.5, MGREY),
            ("INNERGRID",    (0, 0), (-1, -1), 0.3, MGREY),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ]))
        story.append(med_tbl)
        story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # LAB TESTS
    # ─────────────────────────────────────────────────────────────────────────
    if prescription.get("lab_tests"):
        story.append(Paragraph("LAB TESTS / INVESTIGATIONS", sSection))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MGREY, spaceAfter=3))
        story.append(Paragraph(prescription["lab_tests"].replace("\n", "<br/>"), sBody))
        story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # ADVICE
    # ─────────────────────────────────────────────────────────────────────────
    if prescription.get("advice"):
        story.append(Paragraph("DOCTOR'S ADVICE", sSection))
        story.append(HRFlowable(width="100%", thickness=0.5, color=MGREY, spaceAfter=3))
        story.append(Paragraph(prescription["advice"].replace("\n", "<br/>"), sBody))
        story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # FOLLOW-UP
    # ─────────────────────────────────────────────────────────────────────────
    if prescription.get("follow_up_date"):
        fu_date = str(prescription["follow_up_date"])
        fu_tbl = Table(
            [[Paragraph("FOLLOW-UP DATE", sSection), Paragraph(f"<b>{fu_date}</b>", sBodyBold)]],
            colWidths=[W * 0.5, W * 0.5],
        )
        fu_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), LGREY),
            ("BOX",          (0, 0), (-1, -1), 0.5, MGREY),
            ("TOPPADDING",   (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("ALIGN",        (1, 0), (1, 0),   "RIGHT"),
            ("RIGHTPADDING", (1, 0), (1, 0),   8),
        ]))
        story.append(fu_tbl)
        story.append(Spacer(1, 4 * mm))

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNATURE STRIP
    # ─────────────────────────────────────────────────────────────────────────
    sig_tbl = Table(
        [[
            Paragraph(
                f"<font color='#9bb3cc'>Generated by E-Health Care · {datetime.now().strftime('%d %b %Y, %I:%M %p')}</font>",
                sSmall,
            ),
            Paragraph(
                f"<b>Dr. {doctor_name}</b><br/>"
                f"<font color='#9bb3cc'>{qualifications}</font>",
                S("sSig", fontSize=8, textColor=NAVY, fontName="Helvetica", alignment=TA_RIGHT),
            ),
        ]],
        colWidths=[W * 0.6, W * 0.4],
    )
    sig_tbl.setStyle(TableStyle([
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LINEABOVE",    (0, 0), (-1, 0),  0.5, MGREY),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    return abs_path, rel_path