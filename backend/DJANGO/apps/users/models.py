from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

class User(AbstractUser):
    class Roles(models.TextChoices):
        LAWYER = "LAWYER", _("Lawyer")
        NGO = "NGO", _("NGO")
        DONOR = "DONOR", _("Donor")
        ADMIN = "ADMIN", _("Admin/Steward")

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=False, blank=True)
    role = models.CharField(
        max_length=10, choices=Roles.choices, default=Roles.LAWYER
    )

    wallet_address = models.CharField(max_length=42, blank=True, null=True, help_text="Ethereum wallet address")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

class LawyerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="lawyer_profile")
    specialty = models.CharField(max_length=255, blank=True, null=True)
    verified = models.BooleanField(default=False)
    cases_managed = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0,
                                 validators=[MinValueValidator(0.0)])

    def __str__(self):
        return f"LawyerProfile: {self.user.email}"

class NGOProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ngo_profile")
    organization_name = models.CharField(max_length=255)
    verified = models.BooleanField(default=False)
    funded_cases = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"NGOProfile: {self.organization_name}"

class DonorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="donor_profile")
    display_name = models.CharField(max_length=255)
    contribution_count = models.PositiveIntegerField(default=0)
    total_contributed = models.DecimalField(max_digits=12, decimal_places=2, default=0.0,
                                            validators=[MinValueValidator(0.0)])

    def __str__(self):
        return f"DonorProfile: {self.display_name}"

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"AdminProfile: {self.user.email}"
