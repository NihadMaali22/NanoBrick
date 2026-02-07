import os
import json
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_api_key = os.getenv("GOOGLE_API_KEY", "")
_model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
_initialized = False
_client = None


def _ensure_initialized():
    global _initialized, _client
    if _initialized:
        return
    if not _api_key or _api_key == "your_google_api_key_here":
        logger.warning("GOOGLE_API_KEY not set – LLM calls will use fallback.")
        _initialized = True
        return
    try:
        _client = genai.Client(api_key=_api_key)
        _initialized = True
        logger.info("Gemini client initialised with model '%s'.", _model_name)
    except Exception as exc:
        logger.error("Failed to initialise Gemini: %s", exc)
        _initialized = True


def is_available() -> bool:
    _ensure_initialized()
    return _client is not None


def _call_gemini(prompt: str, temperature: float = 0.3) -> str:
    _ensure_initialized()
    if _client is None:
        raise RuntimeError("Gemini client not available")
    
    response = _client.models.generate_content(
        model=_model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=2048,
        )
    )
    return response.text


def _parse_json_response(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)
    return json.loads(cleaned)


CLASSIFY_PROMPT = """\
You are an expert agricultural waste analysis AI for "NanoBrick", a system that converts agricultural waste into bio-construction materials and nanocellulose fibers.

Analyze the following agricultural waste sample and provide a detailed classification.

Waste type: {waste_type}
Condition / decay level: {condition}

Respond ONLY with valid JSON (no markdown fences) matching this exact schema:
{{
  "type": "<scientific name and common name>",
  "category": "<waste category, e.g. Fruit Waste - High Fiber>",
  "properties": {{
    "fiber_content": <number 0-100>,
    "starch_content": <number 0-100 or null if not relevant>,
    "sugar_content": <number 0-100 or null if not relevant>,
    "moisture": <number 0-100>,
    "cellulose_purity": <number 0-100>,
    "lignin_content": <number 0-100>
  }},
  "ripeness": {{
    "level": "<descriptive stage>",
    "usability": <number 0-100>
  }},
  "damage_assessment": {{
    "level": "{condition}",
    "processable": <true/false>,
    "recommended_process": "<enzymatic_treatment | standard | acid_hydrolysis>",
    "explanation": "<brief explanation in Arabic of why this process is recommended>"
  }},
  "ai_analysis": "<A 2-3 sentence expert analysis in Arabic about this waste type, its suitability for NanoBrick conversion, and any special considerations>",
  "confidence": <number 85-99>
}}

Important guidelines:
- For banana (Musa acuminata): high fiber (35-45%), moderate starch, high moisture when fresh
- For date palm (Phoenix dactylifera): high sugar (60-75%), lower fiber (8-15%), low moisture when dried
- For mixed waste: intermediate values
- Adjust properties based on decay condition: fresh has highest quality, severe has lowest
- The confidence should reflect how typical this sample is
- Be scientifically accurate with property ranges
"""


def classify_waste(waste_type: str, condition: str) -> dict:
    prompt = CLASSIFY_PROMPT.format(waste_type=waste_type, condition=condition)
    raw = _call_gemini(prompt, temperature=0.3)
    data = _parse_json_response(raw)

    data.setdefault("type", f"Agricultural Waste ({waste_type})")
    data.setdefault("category", "Organic Material")
    data.setdefault("properties", {})
    data.setdefault("ripeness", {"level": condition, "usability": 75})
    data.setdefault("damage_assessment", {
        "level": condition,
        "processable": True,
        "recommended_process": "standard",
        "explanation": ""
    })
    data.setdefault("ai_analysis", "")
    data.setdefault("confidence", 90)
    return data


CALCULATE_PROMPT = """\
You are an expert materials scientist AI for "NanoBrick", specializing in bio-composite construction materials made from agricultural waste.

Given the following material composition (percentages), predict the resulting bio-brick properties.

Composition:
- Banana fiber: {banana}%
- Date paste (binder): {date}%
- Banana starch: {starch}%
- Agricultural ash: {ash}%
- Nanocellulose: {nano}%

Respond ONLY with valid JSON (no markdown fences) matching this exact schema:
{{
  "properties": {{
    "compressive_strength": {{
      "value": <number in MPa, range 10-45>,
      "unit": "MPa",
      "rating": "<Excellent | Good | Standard>"
    }},
    "thermal_resistance": {{
      "value": <number R-value/inch, range 1.0-4.0>,
      "unit": "R-value/inch",
      "rating": "<Excellent | Good | Standard>"
    }},
    "density": {{
      "value": <number in kg/m³, range 800-1600>,
      "unit": "kg/m³",
      "category": "<Lightweight | Medium | Heavy>"
    }},
    "fire_resistance": {{
      "value": <number in hours, range 0.5-4.0>,
      "unit": "hours",
      "class": "<Class A | Class B | Class C>"
    }},
    "water_absorption": {{
      "value": <number %, range 5-18>,
      "unit": "%",
      "rating": "<Excellent | Good | Standard>"
    }}
  }},
  "sustainability": {{
    "biodegradability": <number 70-100>,
    "carbon_reduction": <number 50-95>,
    "eco_score": <number 60-98>
  }},
  "quality": {{
    "score": <number 0-100>,
    "grade": "<A+ | A | B+ | B | C>"
  }},
  "ai_analysis": "<2-3 sentence expert analysis in Arabic about this composition, its strengths, weaknesses, and recommendations for improvement>"
}}

Scientific guidelines:
- Higher banana fiber → higher tensile/compressive strength, lower density
- Higher nanocellulose → significantly improves strength, water resistance, and fire resistance
- Higher ash content → better fire resistance but may reduce workability
- Higher date paste → better binding but increases density and moisture sensitivity
- Higher starch → improves moldability but may reduce long-term durability
- Compressive strength: base ~15 MPa, banana fiber adds ~0.3/%, nano adds ~2.5/%
- Thermal resistance: base ~1.5, ash adds ~0.05/%, nano adds ~0.1/%
- Grade: A+ (≥85), A (≥75), B+ (≥65), B (≥55), C (<55)
- Be realistic and scientifically consistent
"""


def predict_materials(banana: float, date: float, starch: float,
                      ash: float, nano: float) -> dict:
    prompt = CALCULATE_PROMPT.format(
        banana=banana, date=date, starch=starch, ash=ash, nano=nano
    )
    raw = _call_gemini(prompt, temperature=0.2)
    data = _parse_json_response(raw)

    data.setdefault("properties", {})
    data.setdefault("sustainability", {
        "biodegradability": 85, "carbon_reduction": 70, "eco_score": 77
    })
    data.setdefault("quality", {"score": 70, "grade": "B+"})
    data.setdefault("ai_analysis", "")
    return data
