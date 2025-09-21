from django.urls import path, include
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from .views import (
    VisualizationRequestViewSet, GeneratedVisualizationViewSet,
    ProcessingJobViewSet
)
from .views.mermaid_views import (
    generate_mermaid_from_story, generate_mermaid_from_description,
    generate_mermaid_svg, mermaid_health_check, generate_four_flowcharts
)
from .views.test_views import (
    test_mermaid_generation, test_mermaid_svg, 
    #test_multiple_flowcharts, test_multi_svgs
)
from .views.demo_views import mermaid_demo
from .views.simple_test_view import simple_test_view

router = DefaultRouter()
router.register(r'visualization-requests', VisualizationRequestViewSet, basename='visualization-request')
router.register(r'visualizations', GeneratedVisualizationViewSet, basename='visualization')
router.register(r'processing-jobs', ProcessingJobViewSet, basename='processing-job')

urlpatterns = [
    path('', include(router.urls)),

    # Mermaid-specific endpoints
    path('mermaid/story/<uuid:story_id>/', generate_mermaid_from_story, name='mermaid-from-story'),
    path('mermaid/generate/', generate_mermaid_from_description, name='mermaid-from-description'),
    path('mermaid/generate-four/', generate_four_flowcharts, name='mermaid-generate-four'),
    path('mermaid/svg/', generate_mermaid_svg, name='mermaid-svg'),
    path('mermaid/health/', mermaid_health_check, name='mermaid-health'),

    # Test endpoints (no authentication required)
    path('test/mermaid/', test_mermaid_generation, name='test-mermaid'),
    path('test/svg/', test_mermaid_svg, name='test-svg'),
    # path('test/multi-flowcharts/', test_multiple_flowcharts, name='test-multi-flowcharts'),
    # path('test/multi-svgs/', test_multi_svgs, name='test-multi-svgs'),

    # Demo web interface
    path('demo/', mermaid_demo, name='mermaid-demo'),
    path('simple-test/', simple_test_view, name='simple-test'),
]