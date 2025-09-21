from rest_framework import serializers
from .models import VisualizationRequest, GeneratedVisualization, ProcessingJob

class VisualizationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualizationRequest
        fields = ['id', 'visualization_type', 'status', 'parameters',
                 'created_at', 'updated_at', 'error_message']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'error_message']

class VisualizationRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualizationRequest
        fields = ['story', 'visualization_type', 'parameters']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class GeneratedVisualizationSerializer(serializers.ModelSerializer):
    request_info = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedVisualization
        fields = ['id', 'title', 'description', 'data', 'image_url',
                 'created_at', 'request_info']
        read_only_fields = ['id', 'created_at']

    def get_request_info(self, obj):
        return {
            'id': obj.request.id,
            'visualization_type': obj.request.visualization_type,
            'story_title': obj.request.story.title
        }

class ProcessingJobSerializer(serializers.ModelSerializer):
    story_title = serializers.CharField(source='story.title', read_only=True)

    class Meta:
        model = ProcessingJob
        fields = ['id', 'job_type', 'status', 'story_title', 'parameters',
                 'result', 'error_message', 'created_at', 'updated_at',
                 'started_at', 'completed_at']
        read_only_fields = ['id', 'status', 'result', 'error_message',
                           'created_at', 'updated_at', 'started_at', 'completed_at']

class ProcessingJobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessingJob
        fields = ['job_type', 'story', 'parameters']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)