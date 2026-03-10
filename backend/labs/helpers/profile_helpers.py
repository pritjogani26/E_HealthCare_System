import db.lab_queries as lq
from labs.serializers import LabProfileSerializer
from users.models import UserRole
from users.serializers import UserSerializer


def get_profile_data_by_role(user):
    """BUG FIX: replaced Lab.objects ORM (model doesn't exist) with lq query."""
    if getattr(user, "role", None) == UserRole.LAB:
        try:
            user_id = str(getattr(user, "user_id", ""))
            lab = lq.get_lab_by_user_id(user_id)
            if lab:
                lab["operating_hours"] = lq.get_lab_operating_hours(user_id)
                lab["services"]        = lq.get_lab_services(user_id)
                return LabProfileSerializer(lab).data
        except Exception:
            pass
    from db.user_queries import get_user_by_id
    u = get_user_by_id(str(getattr(user, "user_id", ""))) or {}
    return UserSerializer(u).data