from django.urls import path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    AgentCallbackView,
    WalletDocumentRegistrationView,
)
from . import views  # for ICP views

urlpatterns = [
    # Existing document routes
    path("documents/", DocumentListCreateView.as_view(), name="document-list-create"),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("agent/callback/", AgentCallbackView.as_view(), name="agent-callback"),
    path("wallet/register/", WalletDocumentRegistrationView.as_view(), name="wallet-document-registration"),

    # ICP canister route
    path("icp/records/", views.icp_all_records, name="icp_all_records"),
]
