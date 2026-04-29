# backend/users/database_queries/prescription_queries.py

from users.database_queries.connection import (
    fetchone,
    fetchall,
    fn_scalar,
    execute,
)


def create_prescription(
    appointment_id: int,
    doctor_id: str,
    patient_id: str,
    prescription_number: str,
    clinical_notes: str = None,
    lab_tests: str = None,
    advice: str = None,
    follow_up_date=None,
    pdf_path: str = None,
) -> str:
    """Creates the prescription header and marks the appointment as completed.
    Returns the new prescription_id (UUID string)."""
    result = fetchone(
        "SELECT doc_create_prescription(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            appointment_id,
            doctor_id,
            patient_id,
            prescription_number,
            clinical_notes,
            lab_tests,
            advice,
            follow_up_date,
            pdf_path,
        ),
    )
    return str(list(result.values())[0])


def add_prescription_medicine(
    prescription_id: str,
    medicine_name: str,
    dosage: str = None,
    frequency: str = None,
    duration: str = None,
    instructions: str = None,
    sort_order: int = 0,
) -> int:
    result = fetchone(
        "SELECT doc_add_prescription_medicine(%s, %s, %s, %s, %s, %s, %s)",
        (prescription_id, medicine_name, dosage, frequency, duration, instructions, sort_order),
    )
    return list(result.values())[0]


def update_prescription_pdf(prescription_id: str, pdf_path: str) -> None:
    fetchone(
        "SELECT doc_update_prescription_pdf(%s, %s)",
        (prescription_id, pdf_path),
    )


def get_prescription_by_appointment(appointment_id: int) -> dict | None:
    return fetchone(
        "SELECT * FROM doc_get_prescription_by_appointment(%s)",
        (appointment_id,),
    )


def get_prescription_medicines(prescription_id: str) -> list[dict]:
    return fetchall(
        "SELECT * FROM doc_get_prescription_medicines(%s)",
        (prescription_id,),
    )


def get_patient_prescriptions(patient_id: str) -> list[dict]:
    return fetchall(
        "SELECT * FROM doc_get_patient_prescriptions(%s)",
        (patient_id,),
    )