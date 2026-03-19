# backend\users\models.py
class AccountStatus:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class UserRole:
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
    LAB = "LAB_TECHNICIAN"
    SUPERADMIN = "SUPERADMIN"
    choices = [
        (ADMIN, "ADMIN"),
        (STAFF, "STAFF"),
        (DOCTOR, "DOCTOR"),
        (PATIENT, "PATIENT"),
        (LAB, "LAB"),
        (SUPERADMIN, "SUPERADMIN"),
    ]


class VerificationStatus:
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    choices = [
        (PENDING, "Pending Verification"),
        (VERIFIED, "Verified"),
        (REJECTED, "Rejected"),
        (ACTIVE, "Active"),
    ]


class DocumentType:
    DEGREE = "DEGREE"
    LICENSE = "LICENSE"
    REGISTRATION = "REGISTRATION"
    EXPERIENCE = "EXPERIENCE"
    LAB_LICENSE = "LAB_LICENSE"
    LAB_ACCREDITATION = "LAB_ACCREDITATION"


class WeekDay:
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6
    choices = [
        (MONDAY, "Monday"),
        (TUESDAY, "Tuesday"),
        (WEDNESDAY, "Wednesday"),
        (THURSDAY, "Thursday"),
        (FRIDAY, "Friday"),
        (SATURDAY, "Saturday"),
        (SUNDAY, "Sunday"),
    ]
    LABELS = dict(choices)


class AuditAction:
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_LOGIN_FAILED = "USER_LOGIN_FAILED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    PASSWORD_RESET = "PASSWORD_RESET"
    PATIENT_REGISTERED = "PATIENT_REGISTERED"
    DOCTOR_REGISTERED = "DOCTOR_REGISTERED"
    LAB_REGISTERED = "LAB_REGISTERED"
    PATIENT_PROFILE_UPDATED = "PATIENT_PROFILE_UPDATED"
    DOCTOR_PROFILE_UPDATED = "DOCTOR_PROFILE_UPDATED"
    LAB_PROFILE_UPDATED = "LAB_PROFILE_UPDATED"
    DOCTOR_VERIFIED = "DOCTOR_VERIFIED"
    DOCTOR_REJECTED = "DOCTOR_REJECTED"
    LAB_VERIFIED = "LAB_VERIFIED"
    LAB_REJECTED = "LAB_REJECTED"
    PATIENT_ACTIVATED = "PATIENT_ACTIVATED"
    PATIENT_DEACTIVATED = "PATIENT_DEACTIVATED"
    DOCTOR_ACTIVATED = "DOCTOR_ACTIVATED"
    DOCTOR_DEACTIVATED = "DOCTOR_DEACTIVATED"
    LAB_ACTIVATED = "LAB_ACTIVATED"
    LAB_DEACTIVATED = "LAB_DEACTIVATED"
    ADMIN_ACTION = "ADMIN_ACTION"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class AuditStatus:
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"


class AuditEntityType:
    PATIENT = "Patient"
    DOCTOR = "Doctor"
    LAB = "Lab"
    USER = "User"
    SYSTEM = "System"


class AppointmentStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    choices = [
        (PENDING, "Pending"),
        (CONFIRMED, "Confirmed"),
        (CANCELLED, "Cancelled"),
        (COMPLETED, "Completed"),
        (NO_SHOW, "No Show"),
    ]


class AppointmentType:
    IN_PERSON = "in_person"
    ONLINE = "online"
    choices = [
        (IN_PERSON, "In-Person"),
        (ONLINE, "Online"),
    ]
