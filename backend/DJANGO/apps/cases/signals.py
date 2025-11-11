from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Case, Milestone


@receiver(post_save, sender=Case)
def create_initial_milestone(sender, instance, created, **kwargs):
    """
    Automatically create an initial milestone when a new Case is created.
    """
    if created:
        Milestone.objects.create(
            case=instance,
            title="Case Created",
            description=f"Case '{instance.title}' has been opened.",
            due_date=timezone.now(),
            status="pending",
        )


@receiver(post_save, sender=Milestone)
def update_case_progress(sender, instance, **kwargs):
    """
    Automatically update Case progress when milestones are updated.
    """
    milestones = Milestone.objects.filter(case=instance.case)
    total = milestones.count()
    completed = milestones.filter(status="completed").count()

    if total > 0:
        progress = int((completed / total) * 100)
        instance.case.progress = progress
        instance.case.save(update_fields=["progress"])
