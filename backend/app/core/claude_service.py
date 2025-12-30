import os
import json
import base64
from typing import Optional, Dict, Any, List
import anthropic
from pdfminer.high_level import extract_text
from io import BytesIO

class ClaudeAIService:
    """Service for parsing training plan documents using Claude AI."""
    
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Claude API is configured."""
        return self.client is not None
    
    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Extract text content from a PDF file."""
        try:
            text = extract_text(BytesIO(pdf_content))
            return text
        except Exception as e:
            return f"Error extracting text: {str(e)}"
    
    async def parse_training_plan_pdf(self, pdf_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parse a training plan PDF using Claude AI.
        Returns structured data with weekly structure, workouts, exercises, nutrition.
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Claude API key not configured",
                "data": None
            }
        
        # Extract text from PDF
        pdf_text = self.extract_text_from_pdf(pdf_content)
        
        if not pdf_text or len(pdf_text.strip()) < 50:
            return {
                "success": False,
                "error": "Could not extract sufficient text from PDF",
                "data": None
            }
        
        prompt = f"""Analyze this training plan document and extract structured data.

Document content:
{pdf_text[:15000]}

Extract and return a JSON object with this exact structure:
{{
  "title": "Plan title extracted from document",
  "description": "Brief overview of the training plan",
  "duration_weeks": 12,
  "weekly_structure": [
    {{
      "week": 1,
      "theme": "Base building",
      "focus": "Aerobic endurance"
    }}
  ],
  "workouts": [
    {{
      "title": "Workout name",
      "workout_type": "cycling" | "strength" | "running" | "recovery" | "hiit" | "yoga",
      "day_of_week": 1,
      "week": 1,
      "duration_minutes": 60,
      "intensity": "low" | "medium" | "high",
      "description": "Detailed description",
      "exercises": [
        {{
          "name": "Exercise name",
          "sets": 3,
          "reps": 12,
          "duration_minutes": null,
          "notes": "Any specific instructions"
        }}
      ]
    }}
  ],
  "nutrition_guidance": [
    {{
      "category": "pre_workout" | "post_workout" | "general" | "hydration",
      "recommendation": "Nutrition advice",
      "details": "Additional details"
    }}
  ],
  "goals": [
    {{
      "title": "Goal name",
      "goal_type": "endurance" | "strength" | "weight" | "performance",
      "target_value": 100,
      "unit": "km" | "kg" | "minutes" | "watts"
    }}
  ]
}}

Important:
- Only include data actually found in the document
- Use null for missing fields
- For cycling workouts, exercises might be intervals or zones
- Return ONLY valid JSON, no other text"""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250114",
                max_tokens=4096,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract JSON from response
            response_text = response.content[0].text
            
            # Try to parse JSON directly
            try:
                parsed_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code block
                import re
                json_match = re.search(r'```json?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    parsed_data = json.loads(json_match.group(1))
                else:
                    # Try to find any JSON object
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        parsed_data = json.loads(json_match.group(0))
                    else:
                        raise ValueError("Could not parse JSON from response")
            
            return {
                "success": True,
                "error": None,
                "data": parsed_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": None
            }


# Singleton instance
claude_service = ClaudeAIService()