import json
import base64
import io
from typing import Dict, Any, List, Optional, Union, Generator
from infrastructure.llm_services.llm_service import BaseLLMService
from infrastructure.llm_services.openai_service import OpenAIService


class MultimodalService(BaseLLMService):
    """
    Multimodal LLM service that handles both text and image inputs.
    Extends BaseLLMService to provide vision capabilities across different providers.
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.provider_type = config.get('provider_type', 'openai')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.api_key = config.get('api_key')
        
        # Initialize the appropriate underlying service
        if self.provider_type in ['openai', 'openai_multimodal']:
            self._service = OpenAIService(config)
        elif self.provider_type in ['lmstudio', 'lmstudio_multimodal']:
            from infrastructure.llm_services.lmstudio_service import LMStudioService
            self._service = LMStudioService(config)
        else:
            # Default to OpenAI-compatible interface
            self._service = OpenAIService(config)
    
    def _fetch_models(self) -> List[str]:
        """Fetch available multimodal models from the provider"""
        try:
            all_models = self._service._fetch_models()
            
            # Filter for models that support vision/multimodal capabilities
            multimodal_models = []
            for model in all_models:
                # Common patterns for vision-capable models
                if any(keyword in model.lower() for keyword in [
                    'vision', 'gpt-4v', 'gpt-4-vision', 'claude-3', 'gemini-pro-vision',
                    'llava', 'minigpt', 'blip', 'instructblip', 'multimodal'
                ]):
                    multimodal_models.append(model)
            
            # If no vision models found, return all models (some providers don't use special naming)
            if not multimodal_models and self.provider_type in ['lmstudio', 'lmstudio_multimodal']:
                return all_models
                
            return multimodal_models
            
        except Exception as e:
            print(f"[DEBUG] Error fetching multimodal models: {e}")
            return []
    
    def test_connection(self) -> bool:
        """Test connection to the multimodal service"""
        return self._service.test_connection()
    
    def chat_completion(self, payload: Dict[str, Any]) -> Union[str, Dict[str, Any]]:
        """
        Handle multimodal chat completion.
        Payload can include both text and image content.
        """
        return self._service.chat_completion(payload)
    
    def chat_completion_stream(self, payload: Dict[str, Any]) -> Generator[str, None, None]:
        """
        Handle streaming multimodal chat completion.
        """
        return self._service.chat_completion_stream(payload)
    
    def vision_completion(self, image_data: bytes, prompt: str, model: Optional[str] = None) -> Union[str, Dict[str, Any]]:
        """
        Process image with vision AI and return structured response.
        
        Args:
            image_data: Raw image bytes
            prompt: Text prompt for vision analysis
            model: Optional model name (defaults to service-specific model)
            
        Returns:
            Union[str, Dict]: Response from the vision model
        """
        try:
            # Convert image to base64 for API transmission
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            # Create multimodal message payload
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}"
                            }
                        }
                    ]
                }
            ]
            
            # Prepare payload for vision request
            vision_payload = {
                "model": model or self._get_default_vision_model(),
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            # Use the underlying service's chat completion
            response = self._service.chat_completion(vision_payload)
            
            # Extract content from response
            if isinstance(response, dict) and 'choices' in response:
                return response['choices'][0]['message']['content']
            elif isinstance(response, str):
                return response
            else:
                return str(response)
                
        except Exception as e:
            raise Exception(f"Vision completion failed: {str(e)}")
    
    def multimodal_completion(self, messages: List[Dict[str, Any]], model: Optional[str] = None, **kwargs) -> Union[str, Dict[str, Any]]:
        """
        Handle complex multimodal completion with multiple messages that can contain text and images.
        
        Args:
            messages: List of messages with mixed content (text and images)
            model: Optional model name
            **kwargs: Additional parameters for the completion
            
        Returns:
            Union[str, Dict]: Response from the multimodal model
        """
        payload = {
            "model": model or self._get_default_vision_model(),
            "messages": messages,
            "max_tokens": kwargs.get('max_tokens', 1000),
            "temperature": kwargs.get('temperature', 0.7),
            **kwargs
        }
        
        return self._service.chat_completion(payload)
    
    def _get_default_vision_model(self) -> str:
        """Get the default vision model for this provider"""
        if self.provider_type in ['openai', 'openai_multimodal']:
            return "gpt-4-vision-preview"
        elif self.provider_type in ['lmstudio', 'lmstudio_multimodal']:
            # For LM Studio, try to get a vision model from available models
            models = self.get_models()
            vision_models = [m for m in models if any(keyword in m.lower() for keyword in ['llava', 'vision', 'multimodal'])]
            return vision_models[0] if vision_models else (models[0] if models else "llava")
        else:
            return "gpt-4-vision-preview"  # Default fallback
    
    def encode_image_for_api(self, image_data: bytes, mime_type: str = "image/jpeg") -> str:
        """
        Encode image data for API transmission.
        
        Args:
            image_data: Raw image bytes
            mime_type: MIME type of the image
            
        Returns:
            str: Base64 encoded image with data URL prefix
        """
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        return f"data:{mime_type};base64,{image_b64}"
    
    def supports_streaming(self) -> bool:
        """Check if this provider supports streaming for multimodal requests"""
        return hasattr(self._service, 'chat_completion_stream')
    
    def get_capabilities(self) -> Dict[str, bool]:
        """Get the capabilities of this multimodal service"""
        return {
            "vision": True,
            "streaming": self.supports_streaming(),
            "multiple_images": True,
            "image_generation": False,  # This is for vision, not generation
            "audio": False,  # Could be extended in the future
            "video": False   # Could be extended in the future
        }