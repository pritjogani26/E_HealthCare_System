
class AdminVerifyDoctorView(generics.GenericAPIView):
    """
    PATCH /api/admin/doctors/<user_id>/verify/
    Verify or Reject a doctor account.
    Payload: { "status": "VERIFIED" | "REJECTED", "notes": "optional" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        from .models import VerificationStatus
        
        try:
            doctor = Doctor.objects.select_related("user").get(user__user_id=user_id)
        except Doctor.DoesNotExist:
            return Response(
                {"success": False, "message": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        notes = request.data.get("notes", "")

        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor.verification_status = new_status
        doctor.verification_notes = notes
        doctor.verified_by = request.user
        doctor.verified_at = timezone.now()
        
        # If verified, also activate the account
        if new_status == VerificationStatus.VERIFIED:
            doctor.is_active = True
            doctor.user.is_active = True
            doctor.user.save()
        
        doctor.save()
        
        serializer = self.get_serializer(doctor)
        return Response(
            {
                "success": True, 
                "message": f"Doctor {new_status.lower()} successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class AdminVerifyLabView(generics.GenericAPIView):
    """
    PATCH /api/admin/labs/<user_id>/verify/
    Verify or Reject a lab account.
    Payload: { "status": "VERIFIED" | "REJECTED", "notes": "optional" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = LabProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        from .models import VerificationStatus
        
        try:
            lab = Lab.objects.select_related("user").get(user__user_id=user_id)
        except Lab.DoesNotExist:
            return Response(
                {"success": False, "message": "Lab not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        notes = request.data.get("notes", "")

        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lab.verification_status = new_status
        lab.verification_notes = notes
        lab.verified_by = request.user
        lab.verified_at = timezone.now()
        
        # If verified, also activate the account
        if new_status == VerificationStatus.VERIFIED:
            lab.is_active = True
            lab.user.is_active = True
            lab.user.save()
            
        lab.save()
        
        serializer = self.get_serializer(lab)
        return Response(
            {
                "success": True, 
                "message": f"Lab {new_status.lower()} successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
