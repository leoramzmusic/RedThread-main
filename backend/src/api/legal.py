from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from src.models.legal_document import LegalDocument, DocumentType, Language
from src.api.auth import get_current_user
from src.models.user import User


router = APIRouter()


@router.get("/{doc_type}")
async def get_legal_document(
    doc_type: DocumentType,
    language: Language = Query(Language.ES, description="Document language"),
    version: Optional[str] = None
):
    """
    Get a legal document by type and language.
    Returns the current version by default, or a specific version if provided.
    """
    
    query = {
        "doc_type": doc_type,
        "language": language
    }
    
    if version:
        query["version"] = version
    else:
        query["is_current"] = True
    
    document = await LegalDocument.find_one(query)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Legal document not found for type: {doc_type}, language: {language}"
        )
    
    return {
        "doc_type": document.doc_type,
        "language": document.language,
        "version": document.version,
        "title": document.title,
        "content": document.content,
        "effective_date": document.effective_date.isoformat(),
        "created_at": document.created_at.isoformat()
    }


@router.get("/versions/{doc_type}")
async def get_document_versions(
    doc_type: DocumentType,
    language: Language = Query(Language.ES, description="Document language")
):
    """Get all versions of a legal document"""
    
    documents = await LegalDocument.find(
        {
            "doc_type": doc_type,
            "language": language
        }
    ).sort("-version").to_list()
    
    return [
        {
            "version": doc.version,
            "effective_date": doc.effective_date.isoformat(),
            "is_current": doc.is_current
        }
        for doc in documents
    ]

