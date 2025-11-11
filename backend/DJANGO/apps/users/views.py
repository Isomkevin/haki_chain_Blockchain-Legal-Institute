from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers as drf_serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import RetrieveUpdateAPIView
from .serializers import (
    SignupSerializer, CustomTokenObtainPairSerializer,
    LawyerProfileSerializer, NGOProfileSerializer,
    DonorProfileSerializer, AdminProfileSerializer
)
from .models import User

User = get_user_model()

# ================== Signup ==================
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            token_serializer = CustomTokenObtainPairSerializer(data={
                'email': request.data['email'],
                'password': request.data['password']
            })
            token_serializer.is_valid(raise_exception=True)
            tokens = token_serializer.validated_data

            return Response({
                'message': 'Signup successful.',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'email': user.email,
                'role': user.role,
                'username': user.username,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ================== Login (JWT) ==================
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# ================== Health Check ==================
def health_check(request):
    return Response({"status": "ok"})

# ================== Superuser Creation (Dev Only) ==================
@csrf_exempt
def create_superuser_view(request):
    if request.method != "POST":
        return Response({"error": "POST required"}, status=405)

    if not User.objects.filter(email="admin@hakichain.com").exists():
        User.objects.create_superuser(
            email="admin@hakichain.com",
            password="admin123",
            username="admin",
            role=User.Roles.ADMIN
        )
        return Response({"message": "✅ Superuser created: admin@hakichain.com / admin123"})
    return Response({"message": "❌ Superuser already exists."})

# ================== RoleProfileView ==================
class RoleProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        role_serializers = {
            User.Roles.LAWYER: LawyerProfileSerializer,
            User.Roles.NGO: NGOProfileSerializer,
            User.Roles.DONOR: DonorProfileSerializer,
            User.Roles.ADMIN: AdminProfileSerializer,
        }
        serializer = role_serializers.get(self.request.user.role)
        if not serializer:
            raise drf_serializers.ValidationError("Unknown user role")
        return serializer

    def get_object(self):
        role_profiles = {
            User.Roles.LAWYER: 'lawyer_profile',
            User.Roles.NGO: 'ngo_profile',
            User.Roles.DONOR: 'donor_profile',
            User.Roles.ADMIN: 'admin_profile',
        }
        attr = role_profiles.get(self.request.user.role)
        if not attr:
            raise drf_serializers.ValidationError("Unknown user role")
        return getattr(self.request.user, attr)
