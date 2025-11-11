from django.urls import path
from .views import (
    CaseListCreateAPIView,
    CaseDetailAPIView,
    MilestoneListCreateAPIView,
    MilestoneDetailAPIView,
    CaseNoteListCreateAPIView,
    EvidenceListCreateAPIView,
    LogWorkingHoursAPIView,
)

urlpatterns = [
    # Case CRUD
    path("cases/", CaseListCreateAPIView.as_view(), name="case-list-create"),
    path("cases/<int:pk>/", CaseDetailAPIView.as_view(), name="case-detail"),

    # Milestones
    path("cases/<int:case_id>/milestones/", MilestoneListCreateAPIView.as_view(), name="milestone-list-create"),
    path("milestones/<int:pk>/", MilestoneDetailAPIView.as_view(), name="milestone-detail"),

    # Notes
    path("cases/<int:case_id>/notes/", CaseNoteListCreateAPIView.as_view(), name="case-notes"),

    # Evidence
    path("cases/<int:case_id>/evidence/", EvidenceListCreateAPIView.as_view(), name="case-evidence"),

    # Log working hours
    path("cases/<int:case_id>/log_time/", LogWorkingHoursAPIView.as_view(), name="log-working-hours"),
]
