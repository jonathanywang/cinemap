from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Interview, Question, Response as InterviewResponse
from .serializers import (
    InterviewListSerializer, InterviewDetailSerializer, InterviewCreateSerializer,
    QuestionSerializer, ResponseSerializer, ResponseCreateSerializer
)

class InterviewViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Interview.objects.filter(story__user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return InterviewListSerializer
        elif self.action == 'create':
            return InterviewCreateSerializer
        return InterviewDetailSerializer

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        interview = self.get_object()
        responses = InterviewResponse.objects.filter(
            question__interview=interview,
            user=request.user
        )
        serializer = ResponseSerializer(responses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_response(self, request, pk=None):
        interview = self.get_object()
        question_id = request.data.get('question')

        try:
            question = Question.objects.get(id=question_id, interview=interview)
        except Question.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ResponseCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Question.objects.filter(interview__story__user=self.request.user)

    def perform_create(self, serializer):
        interview_id = self.request.data.get('interview')
        interview = get_object_or_404(
            Interview,
            id=interview_id,
            story__user=self.request.user
        )
        serializer.save(interview=interview)
