from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from ..models import VisualizationRequest, GeneratedVisualization, ProcessingJob
from ..serializers import (
    VisualizationRequestSerializer, VisualizationRequestCreateSerializer,
    GeneratedVisualizationSerializer, ProcessingJobSerializer,
    ProcessingJobCreateSerializer
)
from ..services.mermaid_service import MermaidService
import random

class VisualizationRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VisualizationRequest.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return VisualizationRequestCreateSerializer
        return VisualizationRequestSerializer

    def perform_create(self, serializer):
        # Save the request
        request_obj = serializer.save()

        # Auto-generate mock visualization
        self.generate_mock_visualization(request_obj)

    def generate_mock_visualization(self, request_obj):
        """Generate a visualization based on the request type"""
        viz_type = request_obj.visualization_type
        story = request_obj.story

        # Generate AI-powered Mermaid flowchart
        if viz_type == 'flowchart':
            try:
                # Use Mermaid service to generate AI-powered flowchart
                mermaid_service = MermaidService()
                data = mermaid_service.generate_story_flowchart_data(story)
            except Exception as e:
                # Fallback to generic flowchart if AI generation fails
                print(f"Mermaid generation failed: {e}")
                data = {
                    'type': 'flowchart',
                    'title': f'Story Flow: {story.title}',
                    'mermaid_code': f'''flowchart TD
    A((Start)) --> B["{story.title}"]
    B --> C[Character Introduction]
    C --> D{{Conflict Arises?}}
    D -->|Yes| E[Rising Action]
    E --> F[Climax]
    F --> G[Resolution]
    G --> H((End))
    D -->|No| I[Character Development]
    I --> D''',
                    'description': f'Basic flowchart structure for "{story.title}"',
                    'metadata': {
                        'generated_by': 'Fallback Template',
                        'story_id': str(story.id),
                        'story_title': story.title
                    }
                }
        else:
            # For any other type, default to flowchart
            data = {
                'type': 'flowchart',
                'title': f'Story Flow: {story.title}',
                'steps': [
                    {
                        'type': 'start',
                        'title': 'Beginning',
                        'description': 'Story setup and character introduction'
                    },
                    {
                        'type': 'conflict',
                        'title': 'Middle',
                        'description': 'Conflict development and rising action'
                    },
                    {
                        'type': 'end',
                        'title': 'End',
                        'description': 'Resolution and conclusion'
                    }
                ],
                'themes': ['Narrative', 'Structure', 'Flow']
            }

        # Update request status
        request_obj.status = 'completed'
        request_obj.save()

        # Create the generated visualization
        GeneratedVisualization.objects.create(
            request=request_obj,
            title=data['title'],
            description=f'Auto-generated {viz_type} visualization',
            data=data
        )

    @action(detail=True, methods=['get'])
    def visualization(self, request, pk=None):
        visualization_request = self.get_object()
        try:
            visualization = visualization_request.visualization
            serializer = GeneratedVisualizationSerializer(visualization)
            return Response(serializer.data)
        except GeneratedVisualization.DoesNotExist:
            return Response(
                {'error': 'Visualization not yet generated'},
                status=status.HTTP_404_NOT_FOUND
            )

class GeneratedVisualizationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GeneratedVisualizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GeneratedVisualization.objects.filter(
            request__user=self.request.user
        )

class ProcessingJobViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProcessingJob.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ProcessingJobCreateSerializer
        return ProcessingJobSerializer

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_jobs = self.get_queryset().filter(
            status__in=['queued', 'processing']
        )
        serializer = self.get_serializer(active_jobs, many=True)
        return Response(serializer.data)
