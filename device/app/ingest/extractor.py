"""device/app/ingest/extractor.py — Rule-based entity and claim extraction. No LLM."""

import re

def extract_entities(text: str) -> list[dict]:
    entities = []
    
    # Asset IDs: P-204, C-112, R-07, V-33
    asset_pattern = re.compile(r'[A-Z]-\d{2,3}')
    for match in asset_pattern.finditer(text):
        entities.append({
            "type": "asset_id",
            "value": match.group(0),
            "span": match.span()
        })
        
    # Parameters
    parameters = ["torque", "pressure", "temperature", "clearance"]
    for param in parameters:
        # Case insensitive word match
        pattern = re.compile(rf'\b{param}\b', re.IGNORECASE)
        for match in pattern.finditer(text):
            entities.append({
                "type": "parameter",
                "value": match.group(0).lower(),
                "span": match.span()
            })
            
    return entities

def extract_claims(text: str) -> list[dict]:
    claims = []
    
    # Patterns for NUMBER + UNIT
    # Context is the sentence containing it
    sentences = re.split(r'(?<=\.)\s+', text)
    
    param_patterns = {
        "torque": r'(?i)\btorque.*?(\d+(?:\.\d+)?)\s*(Nm|N-m)\b',
        "pressure": r'(?i)\bpressure.*?(\d+(?:\.\d+)?)\s*(bar|psi|Pa)\b',
        "temperature": r'(?i)\btemperature.*?(\d+(?:\.\d+)?)\s*(°C|C|°F|F)\b',
        "clearance": r'(?i)\bclearance.*?(\d+(?:\.\d+)?)\s*(mm|cm|in)\b'
    }
    
    for sentence in sentences:
        for param, pattern in param_patterns.items():
            match = re.search(pattern, sentence)
            if match:
                val = float(match.group(1))
                unit = match.group(2)
                claims.append({
                    "param": param,
                    "value": val,
                    "unit": unit,
                    "context": sentence.strip()
                })
                
    return claims

def extract_all(text: str) -> dict:
    entities = extract_entities(text)
    claims = extract_claims(text)
    
    tags = set()
    for e in entities:
        if e["type"] == "asset_id":
            tags.add(e["value"])
        elif e["type"] == "parameter":
            tags.add(e["value"])
            
    return {
        "entities": entities,
        "claims": claims,
        "tags": list(tags)
    }
