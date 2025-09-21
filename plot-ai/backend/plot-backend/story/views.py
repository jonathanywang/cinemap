from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Story, Chapter, Character
from .serializers import (
    StoryListSerializer, StoryDetailSerializer, StoryCreateSerializer,
    ChapterSerializer, CharacterSerializer
)

class StoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.action == 'list':
            return Story.objects.filter(user=self.request.user)
        return Story.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return StoryListSerializer
        elif self.action == 'create':
            return StoryCreateSerializer
        return StoryDetailSerializer

    @action(detail=True, methods=['get'])
    def characters(self, request, pk=None):
        story = self.get_object()
        characters = story.characters.all()
        serializer = CharacterSerializer(characters, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        story = self.get_object()
        chapters = story.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)

class CharacterViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Character.objects.filter(story__user=self.request.user)

    def perform_create(self, serializer):
        story_id = self.request.data.get('story')
        story = get_object_or_404(Story, id=story_id, user=self.request.user)
        serializer.save(story=story)

class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chapter.objects.filter(story__user=self.request.user)

    def perform_create(self, serializer):
        story_id = self.request.data.get('story')
        story = get_object_or_404(Story, id=story_id, user=self.request.user)
        serializer.save(story=story)
