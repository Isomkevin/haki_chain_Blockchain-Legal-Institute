from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import LawyerProfile, NGOProfile, DonorProfile, AdminProfile

User = get_user_model()

@receiver(post_save, sender=User)
def create_role_profile(sender, instance, created, **kwargs):
    """
    Automatically create a role-specific profile when a new user is created.
    Wallet-only users get a default 'LAWYER' role profile.
    """
    if created:
        # Wallet-only users may have no role set
        role = getattr(instance, 'role', None) or User.Roles.LAWYER
        
        if role == User.Roles.LAWYER:
            LawyerProfile.objects.get_or_create(user=instance)
        elif role == User.Roles.NGO:
            NGOProfile.objects.get_or_create(user=instance)
        elif role == User.Roles.DONOR:
            DonorProfile.objects.get_or_create(user=instance)
        elif role == User.Roles.ADMIN:
            AdminProfile.objects.get_or_create(user=instance)
