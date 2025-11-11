from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Case(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    VISIBILITY_CHOICES = [
        ("PUBLIC", "Public"),
        ("PRIVATE", "Private"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    type = models.CharField(max_length=100, blank=True)  # e.g. "Family Law"
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="MEDIUM")
    due_date = models.DateField(null=True, blank=True)
    hours_logged = models.DecimalField(max_digits=6, decimal_places=1, default=0.0)
    hours = models.FloatField(default=0, help_text="Total hours logged by lawyers on this case")


    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="cases_created"
    )
    assigned_lawyer = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="cases_assigned", null=True, blank=True
    )

    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="PUBLIC"
    )
    bounty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    progress = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def milestones_summary(self):
        total = self.milestones.count()
        completed = self.milestones.filter(status="completed").count()
        return f"{completed}/{total} milestones" if total else "No milestones"

    def days_left(self):
        if not self.due_date:
            return None
        delta = (self.due_date - timezone.now().date()).days
        return delta

    def __str__(self):
        return self.title


class Milestone(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_released = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.case.title} - {self.title}"


class CaseNote(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note by {self.author} on {self.case}"


class Evidence(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="evidence")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to="evidence/")
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidence for {self.case.title}"
