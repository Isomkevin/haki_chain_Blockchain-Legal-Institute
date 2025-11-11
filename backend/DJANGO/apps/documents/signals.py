from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Document
import requests
import hashlib
import json

def compute_document_hash(doc: Document) -> str:
    # include category and document_type in hash
    raw_data = (
        f"{doc.title}{doc.description}{doc.generated_text}"
        f"{doc.category}{doc.document_type}{doc.jurisdiction}"
        f"{json.dumps(doc.metadata, sort_keys=True)}"
        f"{json.dumps(doc.requirements, sort_keys=True) if doc.requirements else ''}"
        f"{doc.file_url or (doc.file.url if doc.file else '')}"
    )
    return hashlib.sha256(raw_data.encode("utf-8")).hexdigest()

@receiver(post_save, sender=Document)
def notify_fastapi_agent(sender, instance, created, **kwargs):
    """
    Notify FastAPI agent (LangChain/Vertex) and push updated content to Story/ICP/DAG.
    Fixed: prevent infinite loop by skipping signal when updating last_story_hash.
    """
    try:
        # Skip signal if updating last_story_hash internally
        if getattr(instance, "_skip_story_signal", False):
            return

        agent_url = getattr(settings, "AI_AGENT_URL", None)
        story_url = getattr(settings, "STORY_PUSH_URL", None)
        if not agent_url:
            return

        # Full payload including HakiDraft frontend fields
        payload = {
            "document_id": instance.id,
            "user_id": instance.user.id,
            "doc_type": instance.doc_type,
            "title": instance.title,
            "category": instance.category,
            "document_type": instance.document_type,
            "description": instance.description,
            "jurisdiction": instance.jurisdiction,
            "requirements": instance.requirements,
            "metadata": instance.metadata,
            "client_name": getattr(instance, "client_name", getattr(instance, "title", "")),
            "wallet": getattr(instance.user, "wallet_address", None),
            "signature": instance.signature,
            "case_id": instance.case.id if instance.case else None,
            "extracted_text": instance.extracted_text,
        }

        # Notify AI Agent (if new or pending)
        if created or instance.agent_status == "pending":
            requests.post(f"{agent_url}/agent/notify", json=payload, timeout=10)

        # Push to Story/ICP/DAG if hash changed
        if story_url:
            current_hash = compute_document_hash(instance)
            last_hash = getattr(instance, "last_story_hash", None)

            if current_hash != last_hash:
                story_payload = {
                    "document_id": instance.id,
                    "title": instance.title,
                    "content": instance.generated_text,
                    "category": instance.category,
                    "document_type": instance.document_type,
                    "metadata": instance.metadata,
                    "hash": current_hash,
                }
                try:
                    resp = requests.post(f"{story_url}/register", json=story_payload, timeout=15)
                    if resp.status_code == 200:
                        print(f"[Story] Document {instance.id} pushed successfully.")
                        # Prevent signal loop while updating last_story_hash
                        instance._skip_story_signal = True
                        instance.last_story_hash = current_hash
                        instance.save(update_fields=["last_story_hash"])
                        instance._skip_story_signal = False
                    else:
                        print(f"[Story Push Failed] {resp.status_code}: {resp.text}")
                except Exception as e:
                    print(f"[Story Push Error] {e}")

    except Exception as e:
        print(f"[Agent Notify Error] {e}")
