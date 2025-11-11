from django.db import models
from django.conf import settings
from apps.cases.models import Case

class Document(models.Model):
    # Agentic doc types (do not touch!)
    DOC_TYPES = [
        ("lens", "HakiLens"),
        ("draft", "HakiDraft"),
        ("review", "HakiReview"),
        ("repository", "HakiDocs"),
        ("ip", "Intellectual Property"), 
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, null=True, blank=True, related_name="documents")

    title = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)

    # Signature & file
    signature = models.CharField(max_length=512, blank=True, null=True)
    file_url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to="documents/", null=True, blank=True)

    # Frontend-driven fields
    category = models.CharField(max_length=100, blank=True)  # matches documentCategories
    document_type = models.CharField(max_length=100, blank=True)  # matches documentTypesByCategory[category]
    jurisdiction = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    requirements = models.JSONField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    extracted_text = models.TextField(null=True, blank=True)
    client_name = models.CharField(max_length=255, blank=True)

    # AI / generated content
    generated_text = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Agentic flow fields
    agent_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    agent_result = models.JSONField(default=dict, blank=True)

    # Integration fields (HakiChain / ICP / IPFS)
    last_story_hash = models.CharField(max_length=64, blank=True, null=True)
    story_id = models.CharField(max_length=128, blank=True, null=True)
    icp_id = models.CharField(max_length=128, blank=True, null=True)
    ipfs_cid = models.CharField(max_length=128, blank=True, null=True)
    dag_tx = models.CharField(max_length=128, blank=True, null=True) 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['doc_type', 'category', 'document_type']),
        ]

    def __str__(self):
        if self.document_type:
            return f"{self.title} ({self.document_type} / {self.get_doc_type_display()})"
        return f"{self.title} ({self.get_doc_type_display()})"
