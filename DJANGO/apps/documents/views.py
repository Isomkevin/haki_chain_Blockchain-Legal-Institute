from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from .models import Document
from .serializers import DocumentSerializer
from eth_account.messages import encode_defunct
from eth_account import Account
from django.contrib.auth import get_user_model, login
from rest_framework.permissions import AllowAny
from web3 import Web3
import os
import asyncio
from django.http import JsonResponse
from ic.client import Client
from ic.identity import Identity
from ic.principal import Principal
from ic.agent import Agent
from ic.candid import encode, Types
import traceback
from django.db import IntegrityError
import pdfplumber
import requests

User = get_user_model()

# ---------------------------
# CONFIGURATION
# ---------------------------
ICP_HOST = os.getenv("ICP_HOST", "http://127.0.0.1:4943")
CANISTER_ID = os.getenv("ICP_CANISTER_ID", "uxrrr-q7777-77774-qaaaq-cai")

print(f"\n=== BOOT: Loading documents/views.py ===")
print(f"ICP_HOST = {ICP_HOST}")
print(f"CANISTER_ID = {CANISTER_ID}")

# ---------------------------
# AGENT INITIALIZATION
# ---------------------------
DFX_IDENTITY_PATH = "\\\\wsl.localhost\\Ubuntu\\home\\maximillien\\.config\\dfx\\identity\\default\\identity.pem"

try:
    with open(DFX_IDENTITY_PATH, 'rb') as f:
        pem_content = f.read()
    identity = Principal.from_pem(pem_content)
    print(f"✅ Loaded DFX Identity successfully. Principal: {identity.to_text()}")
except FileNotFoundError:
    print(f"🚨 Identity file missing at {DFX_IDENTITY_PATH}")
    identity = Identity()
except Exception as e:
    print(f"🚨 Error loading DFX Identity: {e}")
    traceback.print_exc()
    identity = Identity()

client = Client(ICP_HOST)
agent = Agent(identity, client)
print(f"✅ Agent initialized with client host: {ICP_HOST}")

# ---------------------------
# DOCUMENT LIST + CREATE
# ---------------------------
class DocumentListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        print("\n=== [GET] DocumentListCreateView Called ===")
        wallet = request.GET.get("wallet")
        try:
            user = None

            if wallet:
                wallet = wallet.lower().strip()
                # Try to find user by wallet
                try:
                    user = User.objects.get(wallet_address=wallet)
                    print(f"✅ Found existing user for wallet: {wallet}")
                except User.DoesNotExist:
                    # Optionally, auto-create wallet user
                    email = f"{wallet}@wallet.local"
                    user = User.objects.create(
                        wallet_address=wallet,
                        username=wallet[:20],
                        email=email,
                        role=User.Roles.LAWYER,
                        is_active=True
                    )
                    print(f"🆕 Created new user for wallet: {wallet}")

            elif request.user.is_authenticated:
                user = request.user
                print(f"✅ Authenticated session user: {user.username}")
            else:
                print("⚠️ No wallet or session user; returning 401")
                return Response({"detail": "Authentication required"}, status=401)

            # Base query
            query = Document.objects.filter(user=user)
            
            # Optional filters
            search = request.GET.get("search")
            doc_type = request.GET.get("doc_type")
            agent_status = request.GET.get("agent_status")

            if search:
                query = query.filter(
                    Q(title__icontains=search)
                    | Q(description__icontains=search)
                    | Q(category__icontains=search)
                    | Q(jurisdiction__icontains=search)
                )
            if doc_type:
                query = query.filter(doc_type=doc_type)
            if agent_status:
                query = query.filter(agent_status=agent_status)

            serializer = DocumentSerializer(query.order_by("-created_at"), many=True)
            print(f"✅ Returning {len(serializer.data)} documents for user {user.username}")
            return Response(serializer.data)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        serializer = DocumentSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            document = serializer.save()
            return Response(DocumentSerializer(document).data, status=201)
        else:
            return Response(serializer.errors, status=400)


# ---------------------------
# DOCUMENT DETAIL
# ---------------------------
class DocumentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Document.objects.get(pk=pk, user=user)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        document = self.get_object(pk, request.user)
        if not document:
            return Response({"detail": "Not found"}, status=404)
        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    def put(self, request, pk):
        document = self.get_object(pk, request.user)
        if not document:
            return Response({"detail": "Not found"}, status=404)
        serializer = DocumentSerializer(document, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            updated_doc = serializer.save()
            if request.data.get("retrigger_agent"):
                updated_doc.agent_status = "pending"
                updated_doc.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        document = self.get_object(pk, request.user)
        if not document:
            return Response({"detail": "Not found"}, status=404)
        document.delete()
        return Response(status=204)

# ---------------------------
# AGENT CALLBACK
# ---------------------------
class AgentCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            doc_id = request.data.get("document_id")
            document = Document.objects.get(pk=doc_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=404)

        document.agent_status = request.data.get("status", document.agent_status)
        document.agent_result = request.data.get("result", document.agent_result)
        document.generated_text = request.data.get("generated_text", document.generated_text)
        document.story_id = request.data.get("story_id", document.story_id)
        document.icp_id = request.data.get("icp_id", document.icp_id)
        document.dag_tx = request.data.get("dag_id", document.dag_tx)
        document.ipfs_cid = request.data.get("ipfs_cid", document.ipfs_cid)
        document.last_story_hash = request.data.get("hash", document.last_story_hash)
        document.save()

        return Response({"message": "Document updated", "id": document.id})

# ---------------------------
# WALLET DOCUMENT REGISTRATION (SIGNALS READY)
# ---------------------------
class WalletDocumentRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        wallet_address = request.data.get("wallet")
        signature = request.data.get("signature")
        title = request.data.get("title")
        description = request.data.get("description")
        tags = request.data.get("tags", [])
        file = request.FILES.get("file")

        if not all([wallet_address, signature, title, file]):
            missing_fields = [k for k, v in {
                "wallet": wallet_address,
                "signature": signature,
                "title": title,
                "file": file
            }.items() if not v]
            return Response({"error": f"Missing required fields: {missing_fields}"}, status=400)

        wallet_address = wallet_address.lower()

        # Verify signature
        file_bytes = file.read()
        file.seek(0)
        file_hash = Web3.keccak(file_bytes)
        message = encode_defunct(primitive=file_hash)
        recovered = Account.recover_message(message, signature=signature)
        if recovered.lower() != wallet_address:
            return Response({"error": "Signature mismatch"}, status=400)

        # Extract text if PDF
        extracted_text = ""
        if file.name.lower().endswith(".pdf"):
            try:
                file.seek(0)
                with pdfplumber.open(file) as pdf:
                    extracted_text = "\n".join([page.extract_text() or "" for page in pdf.pages])
            except:
                pass

        # Get or create wallet user
        email = f"{wallet_address}@wallet.local"
        user, created = User.objects.get_or_create(
            wallet_address=wallet_address,
            defaults={
                "email": email,
                "username": wallet_address[:20],
                "role": User.Roles.LAWYER,
            }
        )

        login(request, user)
        doc_type = request.data.get("doc_type", "draft") 

        # Prepare serializer data BEFORE save
        serializer_data = {
            "title": title,
            "description": description,
            "file": file,
            "tags": tags,
            "doc_type": doc_type,
            "signature": signature,
            "wallet": wallet_address,
            "agent_status": "pending",
            "extracted_text": extracted_text,
        }

        serializer = DocumentSerializer(data=serializer_data, context={"request": request})
        if serializer.is_valid():
            # Save triggers post_save signal
            document = serializer.save(user=user)
            return Response({"message": "success", "document_id": document.id}, status=201)
        else:
            return Response(serializer.errors, status=400)


# ---------------------------
# ASYNC RUNNER
# ---------------------------
def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        new_loop = asyncio.new_event_loop()
        return new_loop.run_until_complete(coro)
    else:
        return loop.run_until_complete(coro)

# ---------------------------
# ICP RECORDS
# ---------------------------
async def _list_records():
    try:
        args = encode([])
        raw = agent.query_raw(CANISTER_ID, "list_records", args)
    except Exception as e:
        traceback.print_exc()
        raise

    records = []
    if isinstance(raw, list) and raw:
        try:
            records = raw[0].get("value", [])
        except Exception:
            pass
    return records

def icp_all_records(request):
    try:
        data = run_async(_list_records())
        return JsonResponse({"success": True, "results": data})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)
