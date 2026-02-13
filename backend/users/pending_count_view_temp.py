
class PendingApprovalsCountView(generics.GenericAPIView):
    """
    GET /api/admin/pending-approvals/count/
    Get the count of pending approvals for doctors and labs.
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request, *args, **kwargs):
        pending_doctors = Doctor.objects.filter(verification_status=VerificationStatus.PENDING).count()
        pending_labs = Lab.objects.filter(verification_status=VerificationStatus.PENDING).count()
        
        return Response(
            {
                "success": True,
                "data": {
                    "doctors": pending_doctors,
                    "labs": pending_labs,
                    "total": pending_doctors + pending_labs
                }
            },
            status=status.HTTP_200_OK
        )
