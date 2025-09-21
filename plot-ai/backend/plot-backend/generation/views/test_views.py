from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from ..services.mermaid_service import MermaidService
import json
import os

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # No auth for testing
def test_mermaid_generation(request):
    """
    Test endpoint that generates Mermaid flowchart using Gemini AI API
    """
    try:
        description = request.data.get('description', 'Default test flowchart')
        use_ai = request.data.get('use_ai', True)  # Allow fallback to mock if needed

        if use_ai:
            try:
                # Try to use real Gemini AI API
                mermaid_service = MermaidService()
                mermaid_code = mermaid_service.generate_mermaid_from_description(description)

                return Response({
                    'success': True,
                    'description': description,
                    'mermaid_code': mermaid_code,
                    'message': 'Mermaid flowchart generated successfully using Gemini AI',
                    'generation_method': 'Gemini AI API',
                    'api_used': True
                })

            except Exception as ai_error:
                # If AI fails, fall back to mock generation
                print(f"Gemini AI failed: {ai_error}")

                sample_mermaid = f"""flowchart TD
    A[Start: {description[:30]}...] --> B[Initialize Process]
    B --> C{{Decision Point}}
    C -->|Yes| D[Execute Action]
    C -->|No| E[Handle Alternative]
    D --> F[Complete Process]
    E --> F
    F --> G[End]"""

                return Response({
                    'success': True,
                    'description': description,
                    'mermaid_code': sample_mermaid,
                    'message': 'Fallback: Mock Mermaid flowchart generated (AI failed)',
                    'generation_method': 'Fallback Template',
                    'api_used': False,
                    'ai_error': str(ai_error),
                    'note': 'Gemini AI failed, using fallback template generation'
                })
        else:
            # Explicitly requested mock generation
            sample_mermaid = f"""flowchart TD
    A[Start: {description[:30]}...] --> B[Initialize Process]
    B --> C{{Decision Point}}
    C -->|Yes| D[Execute Action]
    C -->|No| E[Handle Alternative]
    D --> F[Complete Process]
    E --> F
    F --> G[End]"""

            return Response({
                'success': True,
                'description': description,
                'mermaid_code': sample_mermaid,
                'message': 'Mock Mermaid flowchart generated (AI disabled)',
                'generation_method': 'Mock Template',
                'api_used': False,
                'note': 'AI generation was disabled via use_ai=false parameter'
            })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # No auth for testing
def test_mermaid_svg(request):
    """
    Test endpoint that generates SVG using Gemini AI + Mermaid CLI
    """
    try:
        description = request.data.get('description', 'Default test flowchart')
        use_ai = request.data.get('use_ai', True)

        if use_ai:
            try:
                # Try to use real Gemini AI API + Mermaid CLI
                mermaid_service = MermaidService()
                mermaid_code = mermaid_service.generate_mermaid_from_description(description)
                svg_file_path = mermaid_service.render_svg_from_mermaid(mermaid_code)

                # Read SVG content
                with open(svg_file_path, 'rb') as f:
                    svg_content = f.read()

                # Clean up temp file
                os.remove(svg_file_path)

                # Return SVG as download
                response = HttpResponse(svg_content, content_type='image/svg+xml')
                response['Content-Disposition'] = 'attachment; filename="ai_generated_flowchart.svg"'
                return response

            except Exception as ai_error:
                print(f"AI/Mermaid generation failed: {ai_error}")
                # Fall back to simple SVG
                pass

        # Fallback: Simple SVG for testing
        test_svg = f'''<svg width="500" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <rect x="50" y="50" width="150" height="50" fill="lightblue" stroke="black" stroke-width="2"/>
  <text x="125" y="80" text-anchor="middle" font-family="Arial" font-size="12">Start: {description[:20]}...</text>

  <rect x="50" y="150" width="150" height="50" fill="lightgreen" stroke="black" stroke-width="2"/>
  <text x="125" y="180" text-anchor="middle" font-family="Arial" font-size="12">Process</text>

  <polygon points="125,220 175,250 125,280 75,250" fill="yellow" stroke="black" stroke-width="2"/>
  <text x="125" y="255" text-anchor="middle" font-family="Arial" font-size="10">Decision?</text>

  <rect x="250" y="150" width="150" height="50" fill="lightcoral" stroke="black" stroke-width="2"/>
  <text x="325" y="180" text-anchor="middle" font-family="Arial" font-size="12">Action</text>

  <rect x="150" y="350" width="150" height="50" fill="lightgray" stroke="black" stroke-width="2"/>
  <text x="225" y="380" text-anchor="middle" font-family="Arial" font-size="12">End</text>

  <!-- Arrows -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="black"/>
    </marker>
  </defs>

  <line x1="125" y1="100" x2="125" y2="150" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="125" y1="200" x2="125" y2="220" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="175" y1="250" x2="250" y2="175" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="325" y1="200" x2="225" y2="350" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="125" y1="280" x2="225" y2="350" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>

  <!-- Labels -->
  <text x="210" y="220" font-family="Arial" font-size="10" fill="green">Yes</text>
  <text x="170" y="320" font-family="Arial" font-size="10" fill="red">No</text>

  <!-- Title -->
  <text x="250" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">Test Flowchart</text>
  <text x="250" y="45" text-anchor="middle" font-family="Arial" font-size="12">Generated by Django (Fallback)</text>
</svg>'''

        response = HttpResponse(test_svg, content_type='image/svg+xml')
        response['Content-Disposition'] = 'attachment; filename="fallback_flowchart.svg"'
        return response

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)