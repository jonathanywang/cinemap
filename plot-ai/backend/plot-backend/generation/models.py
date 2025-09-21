from django.db import models
from django.contrib.auth.models import User
from story.models import Story
import uuid

class VisualizationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    VISUALIZATION_TYPES = [
        ('timeline', 'Timeline'),
        ('character_map', 'Character Relationship Map'),
        ('plot_diagram', 'Plot Structure Diagram'),
        ('mood_chart', 'Mood/Tone Chart'),
        ('word_cloud', 'Word Cloud'),
        ('flowchart', 'Mermaid Flowchart'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='visualization_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    visualization_type = models.CharField(max_length=20, choices=VISUALIZATION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    parameters = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.visualization_type} for {self.story.title}"

class GeneratedVisualization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(VisualizationRequest, on_delete=models.CASCADE, related_name='visualization')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    data = models.JSONField()
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visualization: {self.title}"

class ProcessingJob(models.Model):
    JOB_TYPES = [
        ('story_analysis', 'Story Analysis'),
        ('character_extraction', 'Character Extraction'),
        ('plot_analysis', 'Plot Analysis'),
        ('visualization_generation', 'Visualization Generation'),
    ]

    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_type = models.CharField(max_length=30, choices=JOB_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='processing_jobs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    parameters = models.JSONField(blank=True, null=True)
    result = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_type} - {self.status}"
