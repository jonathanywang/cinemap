from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from story.models import Story
from ..services.mermaid_service import MermaidService
import json
import os

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_mermaid_from_story(request, story_id):
    """
    Generate Mermaid flowchart from a specific story
    """
    try:
        # Get the story
        story = get_object_or_404(Story, id=story_id, user=request.user)

        # Initialize Mermaid service
        mermaid_service = MermaidService()

        # Generate Mermaid code
        mermaid_code = mermaid_service.generate_mermaid_from_story(
            story.content,
            story.title
        )

        return Response({
            'success': True,
            'story_id': str(story.id),
            'story_title': story.title,
            'mermaid_code': mermaid_code,
            'message': 'Mermaid flowchart generated successfully'
        })

    except Story.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Story not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_mermaid_from_description(request):
    """
    Generate Mermaid flowchart from a text description
    """
    try:
        description = request.data.get('description', '')
        flowchart_type = request.data.get('flowchart_type', 'main_story')

        if not description:
            return Response(
                {'success': False, 'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate flowchart_type
        valid_types = ['main_story', 'alternative_1', 'alternative_2', 'alternative_3']
        if flowchart_type not in valid_types:
            return Response(
                {'success': False, 'error': f'flowchart_type must be one of: {valid_types}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize Mermaid service
        mermaid_service = MermaidService()

        # Generate specific flowchart based on type
        mermaid_code = mermaid_service.generate_mermaid_from_description(description, flowchart_type)

        return Response({
            'success': True,
            'description': description,
            'flowchart_type': flowchart_type,
            'mermaid_code': mermaid_code,
            'message': f'Mermaid flowchart generated successfully for {flowchart_type}'
        })

    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_mermaid_svg(request):
    """
    Generate Mermaid flowchart and return as SVG file
    """
    try:
        # Get parameters
        mermaid_code = request.data.get('mermaid_code', '')
        description = request.data.get('description', '')
        story_id = request.data.get('story_id', None)

        # Initialize Mermaid service
        mermaid_service = MermaidService()

        # If no mermaid_code provided, generate from description or story
        if not mermaid_code:
            if story_id:
                story = get_object_or_404(Story, id=story_id, user=request.user)
                mermaid_code = mermaid_service.generate_mermaid_from_story(
                    story.content,
                    story.title
                )
            elif description:
                mermaid_code = mermaid_service.generate_mermaid_from_description(description)
            else:
                return Response(
                    {'success': False, 'error': 'Either mermaid_code, description, or story_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Generate SVG
        svg_file_path = mermaid_service.render_svg_from_mermaid(mermaid_code)

        # Read SVG content
        with open(svg_file_path, 'rb') as f:
            svg_content = f.read()

        # Clean up temp file
        os.remove(svg_file_path)

        # Return SVG as download
        response = HttpResponse(svg_content, content_type='image/svg+xml')
        response['Content-Disposition'] = 'attachment; filename="flowchart.svg"'
        return response

    except Story.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Story not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_four_flowcharts(request):
    """
    Generate four predefined story flowcharts (main story + 3 character perspectives)
    """
    try:
        # Define the four flowcharts
        flowcharts = {
            'main_story': {
                'title': 'Main Story Flow',
                'mermaid_code': '''flowchart TD
    A[Opening Scene] --> B[Introduce Character A]
    B --> C[Introduce Character B]
    C --> D[Introduce Character C]
    D --> E{Paths Cross?}
    E --Yes--> F[Shared Challenge 1: Heist]
    F --> G{A's Courage Tested?}
    G --Success--> H[Confrontation: Escape]
    G --Fails--> I[Captured] --> J[Closing Scene - Prison]
    H --> K{B's Intellect Crucial?}
    K --Success--> L[Successful Escape]
    K --Fails--> M[Captured] --> J
    L --> N{C's Empathy Influences?}
    N --Helps Others--> O[Closing Scene - Freedom]
    N --Self-Preservation--> P[Closing Scene - Alone]
    E --No--> Q[A's Ambitious Plan]
    Q --> R[B's Intellectual Pursuit]
    R --> S[C's Empathetic Mission]
    S --> T{Paths Converge?}
    T --Yes--> F
    T --No--> U[Separate Endings] --> V[Closing Scene - Divergent Paths]'''
            },
            'character_a': {
                'title': 'Character A Journey',
                'mermaid_code': '''flowchart TD
    A[Opening Scene] --> B[Introduce Character A]
    B --> Q[A's Ambitious Plan]
    Q --> T{Paths Converge?}
    T --Yes--> F[Shared Challenge 1: Heist]
    F --> G{A's Courage Tested?}
    G --Success--> H[Confrontation: Escape]
    G --Fails--> I[Captured] --> J[Closing Scene - Prison]
    H --> K{B's Intellect Crucial?}
    K --Success--> L[Successful Escape]
    K --Fails--> M[Captured] --> J
    L --> N{C's Empathy Influences?}
    N --Helps Others--> O[Closing Scene - Freedom]
    N --Self-Preservation--> P[Closing Scene - Alone]
    T --No--> U[Separate Endings] --> V[Closing Scene - Divergent Paths]'''
            },
            'character_b': {
                'title': 'Character B Journey',
                'mermaid_code': '''flowchart TD
    A[Opening Scene] --> C[Introduce Character B]
    C --> R[B's Intellectual Pursuit]
    R --> T{Paths Converge?}
    T --Yes--> F[Shared Challenge 1: Heist]
    F --> G{A's Courage Tested?}
    G --Success--> H[Confrontation: Escape]
    H --> K{B's Intellect Crucial?}
    K --Success--> L[Successful Escape]
    K --Fails--> M[Captured] --> J[Closing Scene - Prison]
    L --> N{C's Empathy Influences?}
    N --Helps Others--> O[Closing Scene - Freedom]
    N --Self-Preservation--> P[Closing Scene - Alone]
    T --No--> U[Separate Endings] --> V[Closing Scene - Divergent Paths]'''
            },
            'character_c': {
                'title': 'Character C Journey',
                'mermaid_code': '''flowchart TD
    A[Opening Scene] --> D[Introduce Character C]
    D --> S[C's Empathetic Mission]
    S --> T{Paths Converge?}
    T --Yes--> F[Shared Challenge 1: Heist]
    F --> G{A's Courage Tested?}
    G --Success--> H[Confrontation: Escape]
    H --> K{B's Intellect Crucial?}
    K --Success--> L[Successful Escape]
    L --> N{C's Empathy Influences?}
    N --Helps Others--> O[Closing Scene - Freedom]
    N --Self-Preservation--> P[Closing Scene - Alone]
    T --No--> U[Separate Endings] --> V[Closing Scene - Divergent Paths]'''
            }
        }

        return Response({
            'success': True,
            'flowcharts': flowcharts,
            'count': len(flowcharts),
            'message': 'Four flowcharts generated successfully'
        })

    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Allow anonymous access for health check
def mermaid_health_check(request):
    """
    Check if Mermaid service is properly configured
    """
    try:
        mermaid_service = MermaidService()
        models = mermaid_service.get_available_models()
        selected_model = mermaid_service.pick_text_model(models)

        return Response({
            'success': True,
            'gemini_api_configured': bool(mermaid_service.api_key),
            'available_models_count': len(models),
            'selected_model': selected_model,
            'message': 'Mermaid service is healthy'
        })

    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )