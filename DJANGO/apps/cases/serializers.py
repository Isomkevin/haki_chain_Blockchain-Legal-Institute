from rest_framework import serializers
from .models import Case, Milestone, CaseNote, Evidence


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class CaseNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.email", read_only=True)

    class Meta:
        model = CaseNote
        fields = ["id", "case", "author", "author_name", "content", "timestamp"]
        read_only_fields = ["timestamp"]


class EvidenceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.email", read_only=True)

    class Meta:
        model = Evidence
        fields = ["id", "case", "uploaded_by", "uploaded_by_name", "file", "description", "uploaded_at"]
        read_only_fields = ["uploaded_at"]


class CaseSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    notes = CaseNoteSerializer(many=True, read_only=True)
    evidence = EvidenceSerializer(many=True, read_only=True)
    created_by_name = serializers.EmailField(source="created_by.email", read_only=True)
    assigned_lawyer_name = serializers.EmailField(source="assigned_lawyer.email", read_only=True)
    milestones_summary = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_milestones_summary(self, obj):
        return obj.milestones_summary()

    def get_days_left(self, obj):
        return obj.days_left()
