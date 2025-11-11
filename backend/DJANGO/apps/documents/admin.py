from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "doc_type", "agent_status", "created_at")
    list_filter = ("doc_type", "agent_status", "jurisdiction")
    search_fields = ("title", "description", "user__username")
    ordering = ("-created_at",)
