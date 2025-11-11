from rest_framework import serializers
from .models import Document
from django.contrib.auth import get_user_model

User = get_user_model()

# ---------------------------
# Main Document Serializer
# ---------------------------
class DocumentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    wallet = serializers.CharField(max_length=42, write_only=True, required=False)
    signature = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Document
        fields = [
            'id', 'user', 'title', 'description', 'file', 'tags', 
            'doc_type', 'signature', 'wallet', 'extracted_text', 
            'agent_status', 'agent_result', 'generated_text', 'created_at',
            'story_id', 'icp_id', 'dag_tx', 'ipfs_cid', 'last_story_hash'
        ]
        read_only_fields = ('user', 'agent_status', 'agent_result', 'generated_text', 
                            'story_id', 'icp_id', 'dag_tx', 'ipfs_cid', 'last_story_hash')

    def create(self, validated_data):
        # ---------------------------
        # 1. Pop temporary fields
        # ---------------------------
        wallet = validated_data.pop('wallet', None)
        validated_data.pop('signature', None)
        extracted_text = validated_data.get('extracted_text', '')

        # ---------------------------
        # 2. Ensure `user` is set (signals rely on this)
        # ---------------------------
        if 'user' not in validated_data:
            request = self.context.get("request")
            if request:
                if hasattr(request, "user") and request.user.is_authenticated:
                    validated_data['user'] = request.user
                elif wallet:
                    # Wallet-only user creation (same as working version)
                    user, created = User.objects.get_or_create(
                        wallet_address=wallet,
                        defaults={
                            "email": f"{wallet}@ipuser.local",
                            "username": wallet[:20],  # truncate to 20 chars
                        }
                    )
                    validated_data['user'] = user

        # ---------------------------
        # 3. Create instance
        # ---------------------------
        validated_data['extracted_text'] = extracted_text
        return super().create(validated_data)

    def to_internal_value(self, data):
        """Handle extracted_text if it's passed as None."""
        if 'extracted_text' in data and data['extracted_text'] is None:
            data['extracted_text'] = ""
        return super().to_internal_value(data)


# ---------------------------
# Wallet User Serializer
# ---------------------------
class WalletUserSerializer(serializers.ModelSerializer):
    wallet_address = serializers.CharField(max_length=42)

    class Meta:
        model = User
        fields = ['wallet_address']

    def create(self, validated_data):
        wallet = validated_data['wallet_address']
        user, created = User.objects.get_or_create(
            wallet_address=wallet,
            defaults={
                "email": f"{wallet}@ipuser.local",
                "username": wallet,
                "is_active": True,
            }
        )
        return user
