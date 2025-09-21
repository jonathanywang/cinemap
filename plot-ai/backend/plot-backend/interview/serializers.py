from rest_framework import serializers
from .models import Interview, Question, Response

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'options', 'order', 'is_required']
        read_only_fields = ['id']

class ResponseSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)

    class Meta:
        model = Response
        fields = ['id', 'question', 'question_text', 'answer', 'created_at']
        read_only_fields = ['id', 'created_at']

class InterviewListSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    responses_count = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = ['id', 'title', 'description', 'created_at', 'updated_at',
                 'is_completed', 'questions_count', 'responses_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_questions_count(self, obj):
        return obj.questions.count()

    def get_responses_count(self, obj):
        return Response.objects.filter(question__interview=obj).count()

class InterviewDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = ['id', 'title', 'description', 'created_at', 'updated_at',
                 'is_completed', 'questions']
        read_only_fields = ['id', 'created_at', 'updated_at']

class InterviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ['title', 'description', 'story']

class ResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Response
        fields = ['question', 'answer']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)