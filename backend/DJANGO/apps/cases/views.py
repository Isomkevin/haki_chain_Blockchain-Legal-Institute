from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Case, Milestone, CaseNote, Evidence
from .serializers import (
    CaseSerializer,
    MilestoneSerializer,
    CaseNoteSerializer,
    EvidenceSerializer,
)


# -------------------------
# CASE CRUD
# -------------------------
class CaseListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cases = Case.objects.all().order_by("-created_at")
        serializer = CaseSerializer(cases, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CaseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CaseDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Case, pk=pk)

    def get(self, request, pk):
        case = self.get_object(pk)
        serializer = CaseSerializer(case)
        return Response(serializer.data)

    def put(self, request, pk):
        case = self.get_object(pk)
        serializer = CaseSerializer(case, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        case = self.get_object(pk)
        case.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------
# MILESTONES
# -------------------------
class MilestoneListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, case_id):
        milestones = Milestone.objects.filter(case_id=case_id)
        serializer = MilestoneSerializer(milestones, many=True)
        return Response(serializer.data)

    def post(self, request, case_id):
        request.data["case"] = case_id
        serializer = MilestoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MilestoneDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Milestone, pk=pk)

    def put(self, request, pk):
        milestone = self.get_object(pk)
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------
# NOTES
# -------------------------
class CaseNoteListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, case_id):
        notes = CaseNote.objects.filter(case_id=case_id).order_by("-timestamp")
        serializer = CaseNoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request, case_id):
        request.data["case"] = case_id
        serializer = CaseNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------
# EVIDENCE
# -------------------------
class EvidenceListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, case_id):
        evidence = Evidence.objects.filter(case_id=case_id)
        serializer = EvidenceSerializer(evidence, many=True)
        return Response(serializer.data)

    def post(self, request, case_id):
        request.data["case"] = case_id
        serializer = EvidenceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# -------------------------
# LOG WORKING HOURS
# -------------------------
class LogWorkingHoursAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, case_id):
        """
        Log working hours on a case.
        Expected body: { "hours": 2.5, "description": "Prepared court documents" }
        """
        case = get_object_or_404(Case, pk=case_id)
        hours = request.data.get("hours")
        description = request.data.get("description", "")

        if not hours:
            return Response({"error": "Hours field is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Update the case's total hours
        case.hours = (case.hours or 0) + float(hours)
        case.save(update_fields=["hours"])

        # Optionally, log it as a note for history tracking
        CaseNote.objects.create(
            case=case,
            author=request.user,
            content=f"⏱ Logged {hours} hours: {description}",
        )

        return Response(
            {"message": f"{hours} hours logged successfully.", "total_hours": case.hours},
            status=status.HTTP_200_OK,
        )



# -------------------------
# DASHBOARD FILTERED VIEW
# -------------------------
class CaseDashboardAPIView(ListAPIView):
    """
    Supports dashboard filtering by status, priority, and lawyer.
    """
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Case.objects.all().order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["status", "priority", "category", "assigned_lawyer"]
    search_fields = ["title", "description", "category"]
