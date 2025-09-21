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

        if not description:
            return Response(
                {'success': False, 'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize Mermaid service
        mermaid_service = MermaidService()

        # Generate Mermaid code
        mermaid_code = mermaid_service.generate_mermaid_from_description(description)

        return Response({
            'success': True,
            'description': description,
            'mermaid_code': mermaid_code,
            'message': 'Mermaid flowchart generated successfully'
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