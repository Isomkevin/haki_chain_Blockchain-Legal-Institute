from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import LawyerProfile, NGOProfile, DonorProfile, AdminProfile

User = get_user_model()

# ================== JWT Token Serializer ==================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['email'] = self.user.email
        data['role'] = self.user.role
        return data

# ================== Signup Serializer ==================
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=User.Roles.choices)

    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'username']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', User.Roles.LAWYER),
            username=validated_data.get('username', validated_data['email'])
        )
        return user

# ================== Role-specific Serializers ==================
class LawyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerProfile
        fields = ['specialty', 'verified', 'cases_managed', 'rating']

class NGOProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGOProfile
        fields = ['organization_name', 'verified', 'funded_cases']

class DonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorProfile
        fields = ['display_name', 'contribution_count', 'total_contributed']

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['permissions']
        
