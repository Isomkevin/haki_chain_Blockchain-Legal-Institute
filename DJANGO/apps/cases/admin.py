from django.contrib import admin
from .models import Case, Milestone, CaseNote, Evidence


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 1
    fields = ("title", "status", "due_date", "payment_released")
    readonly_fields = ("created_at",)
    show_change_link = True


class CaseNoteInline(admin.TabularInline):
    model = CaseNote
    extra = 1
    fields = ("author", "content", "timestamp")
    readonly_fields = ("timestamp",)


class EvidenceInline(admin.TabularInline):
    model = Evidence
    extra = 1
    fields = ("uploaded_by", "file", "description", "uploaded_at")
    readonly_fields = ("uploaded_at",)


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "category",
        "type",
        "priority",
        "status",
        "progress",
        "created_by",
        "assigned_lawyer",
        "bounty_amount",
        "due_date",
        "hours_logged",
        "visibility",
        "milestones_summary",
        "days_left",
        "created_at",
    )
    list_filter = ("status", "priority", "visibility", "created_at")
    search_fields = ("title", "description", "category", "type", "created_by__username")
    inlines = [MilestoneInline, CaseNoteInline, EvidenceInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "case",
        "title",
        "status",
        "due_date",
        "payment_released",
        "created_at",
    )
    list_filter = ("status", "payment_released", "due_date")
    search_fields = ("title", "case__title")
    readonly_fields = ("created_at",)


@admin.register(CaseNote)
class CaseNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "case", "author", "timestamp")
    list_filter = ("timestamp",)
    search_fields = ("case__title", "author__username", "content")
    readonly_fields = ("timestamp",)


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ("id", "case", "uploaded_by", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = ("case__title", "uploaded_by__username", "description")
    readonly_fields = ("uploaded_at",)
