from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from src.models.system_options import SystemOption

router = APIRouter()

@router.get("")
async def get_all_options(lang: str = "es"):
    """
    Get all active options grouped by category in specified language.
    Useful for initial app load.
    """
    options = await SystemOption.find(
        SystemOption.is_active == True
    ).sort(+SystemOption.order).to_list()
    
    label_field = f"label_{lang}" if lang in ["es", "en", "pt", "fr"] else "label_es"
    
    result = {}
    for opt in options:
        if opt.category not in result:
            result[opt.category] = []
        result[opt.category].append({
            "value": opt.value, 
            "label": getattr(opt, label_field, opt.label)
        })
        
    return result


@router.get("/{category}")
async def get_options(category: str, lang: str = "es"):
    """
    Get all active options for a specific category in specified language.
    Returns a list of dicts with 'value' and 'label'.
    """
    options = await SystemOption.find(
        SystemOption.category == category,
        SystemOption.is_active == True
    ).sort(+SystemOption.order).to_list()
    
    if not options:
        return []
    
    # Select label based on language
    label_field = f"label_{lang}" if lang in ["es", "en", "pt", "fr"] else "label_es"
    
    return [
        {"value": opt.value, "label": getattr(opt, label_field, opt.label)}
        for opt in options
    ]

