from rest_framework import serializers
from .models import Story, Chapter, Character

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'name', 'description', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StoryListSerializer(serializers.ModelSerializer):
    characters_count = serializers.SerializerMethodField()
    chapters_count = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ['id', 'title', 'description', 'created_at', 'updated_at',
                 'is_public', 'characters_count', 'chapters_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_characters_count(self, obj):
        return obj.characters.count()

    def get_chapters_count(self, obj):
        return obj.chapters.count()

class StoryDetailSerializer(serializers.ModelSerializer):
    characters = CharacterSerializer(many=True, read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Story
        fields = ['id', 'title', 'description', 'content', 'created_at',
                 'updated_at', 'is_public', 'characters', 'chapters']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['title', 'description', 'content', 'is_public']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)