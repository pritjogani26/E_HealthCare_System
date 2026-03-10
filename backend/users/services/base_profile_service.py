class BaseProfileService:
    """
    Mixin providing the trivial role-check that every profile service needs.
    Each concrete ProfileService should inherit this rather than copy the method.
    """

    @staticmethod
    def validate_user_role(user, required_role: str) -> bool:
        return user.role == required_role
