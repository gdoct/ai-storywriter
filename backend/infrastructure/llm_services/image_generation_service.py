import json
import requests
import base64
import io
from typing import Dict, Any, List, Optional, Union, Generator
from infrastructure.llm_services.llm_service import BaseLLMService


class ImageGenerationService(BaseLLMService):
    """
    Image generation LLM service that handles text-to-image generation.
    Supports multiple providers like DALL-E, Stable Diffusion, and ComfyUI.
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.provider_type = config.get('provider_type', 'openai_dalle')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.api_key = config.get('api_key')
        
        # Provider-specific configuration
        self.timeout = config.get('timeout', 120)  # Image generation can take time
        self.default_size = config.get('default_size', '1024x1024')
        self.default_quality = config.get('default_quality', 'standard')
        
        # Set up headers
        self.headers = {
            'Content-Type': 'application/json'
        }
        
        if self.api_key:
            if self.provider_type in ['openai_dalle']:
                self.headers['Authorization'] = f'Bearer {self.api_key}'
            elif self.provider_type in ['stability_ai']:
                self.headers['Authorization'] = f'Bearer {self.api_key}'
    
    def _fetch_models(self) -> List[str]:
        """Fetch available image generation models from the provider"""
        try:
            if self.provider_type == 'openai_dalle':
                return ['dall-e-2', 'dall-e-3']
            elif self.provider_type == 'stability_ai':
                return ['stable-diffusion-v1-6', 'stable-diffusion-xl-1024-v1-0']
            elif self.provider_type == 'comfyui':
                # ComfyUI would require querying the API for available models
                return ['stable-diffusion-v1-5', 'stable-diffusion-v2-1']
            else:
                return ['dall-e-2']  # Default fallback
                
        except Exception as e:
            print(f"[DEBUG] Error fetching image generation models: {e}")
            return []
    
    def test_connection(self) -> bool:
        """Test connection to the image generation service"""
        try:
            if self.provider_type == 'openai_dalle':
                # Test OpenAI connection
                test_url = f"{self.base_url}/models"
                response = requests.get(test_url, headers=self.headers, timeout=10)
                return response.status_code == 200
            elif self.provider_type == 'stability_ai':
                # Test Stability AI connection
                test_url = f"{self.base_url}/v1/engines/list"
                response = requests.get(test_url, headers=self.headers, timeout=10)
                return response.status_code == 200
            else:
                # For other providers, assume connection is valid if config is provided
                return bool(self.base_url)
                
        except Exception as e:
            print(f"[DEBUG] Image service connection test failed: {e}")
            return False
    
    def chat_completion(self, payload: Dict[str, Any]) -> Union[str, Dict[str, Any]]:
        """
        Handle image generation request (non-streaming).
        This adapts the chat completion interface for image generation.
        """
        # Extract prompt from chat messages
        prompt = self._extract_prompt_from_messages(payload.get('messages', []))
        
        # Generate image
        return self.generate_image(
            prompt=prompt,
            model=payload.get('model'),
            size=payload.get('size', self.default_size),
            quality=payload.get('quality', self.default_quality),
            n=payload.get('n', 1)
        )
    
    def chat_completion_stream(self, payload: Dict[str, Any]) -> Generator[str, None, None]:
        """
        Handle streaming image generation (simulate streaming with status updates).
        """
        prompt = self._extract_prompt_from_messages(payload.get('messages', []))
        
        # Simulate streaming with status updates
        yield f"data: {{\"status\": \"starting\", \"message\": \"Initializing image generation...\"}}\n\n"
        yield f"data: {{\"status\": \"processing\", \"message\": \"Generating image for: {prompt[:50]}...\"}}\n\n"
        
        try:
            result = self.generate_image(
                prompt=prompt,
                model=payload.get('model'),
                size=payload.get('size', self.default_size),
                quality=payload.get('quality', self.default_quality),
                n=payload.get('n', 1)
            )
            
            yield f"data: {{\"status\": \"completed\", \"result\": {json.dumps(result)}}}\n\n"
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {{\"status\": \"error\", \"error\": \"{str(e)}\"}}\n\n"
            yield "data: [DONE]\n\n"
    
    def generate_image(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        size: str = None,
        quality: str = None,
        n: int = 1,
        style: str = None
    ) -> Dict[str, Any]:
        """
        Generate an image from a text prompt.
        
        Args:
            prompt: Text description of the image to generate
            model: Model to use for generation
            size: Image size (e.g., '1024x1024')
            quality: Image quality ('standard' or 'hd')
            n: Number of images to generate
            style: Style for the image ('vivid' or 'natural')
            
        Returns:
            Dict containing image URLs and metadata
        """
        try:
            if self.provider_type == 'openai_dalle':
                return self._generate_dalle_image(prompt, model, size, quality, n, style)
            elif self.provider_type == 'stability_ai':
                return self._generate_stability_image(prompt, model, size)
            elif self.provider_type == 'comfyui':
                return self._generate_comfyui_image(prompt, model)
            else:
                raise ValueError(f"Unsupported image generation provider: {self.provider_type}")
                
        except Exception as e:
            raise Exception(f"Image generation failed: {str(e)}")
    
    def _generate_dalle_image(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        size: str = None,
        quality: str = None,
        n: int = 1,
        style: str = None
    ) -> Dict[str, Any]:
        """Generate image using DALL-E API"""
        url = f"{self.base_url}/images/generations"
        
        payload = {
            "model": model or "dall-e-3",
            "prompt": prompt,
            "n": n,
            "size": size or self.default_size
        }
        
        # DALL-E 3 specific parameters
        if model == "dall-e-3" or not model:
            if quality:
                payload["quality"] = quality
            if style:
                payload["style"] = style
        
        response = requests.post(url, headers=self.headers, json=payload, timeout=self.timeout)
        response.raise_for_status()
        
        result = response.json()
        return {
            "provider": "dalle",
            "model": payload["model"],
            "prompt": prompt,
            "images": result.get("data", []),
            "created": result.get("created"),
            "usage": result.get("usage", {})
        }
    
    def _generate_stability_image(self, prompt: str, model: Optional[str] = None, size: str = None) -> Dict[str, Any]:
        """Generate image using Stability AI API"""
        engine = model or "stable-diffusion-xl-1024-v1-0"
        url = f"{self.base_url}/v1/generation/{engine}/text-to-image"
        
        # Parse size for Stability AI format
        if size:
            width, height = map(int, size.split('x'))
        else:
            width, height = 1024, 1024
        
        payload = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "height": height,
            "width": width,
            "samples": 1,
            "steps": 30
        }
        
        response = requests.post(url, headers=self.headers, json=payload, timeout=self.timeout)
        response.raise_for_status()
        
        result = response.json()
        
        # Convert Stability AI response to common format
        images = []
        for artifact in result.get("artifacts", []):
            if artifact.get("base64"):
                images.append({
                    "b64_json": artifact["base64"],
                    "finish_reason": artifact.get("finishReason", "SUCCESS")
                })
        
        return {
            "provider": "stability",
            "model": engine,
            "prompt": prompt,
            "images": images
        }
    
    def _generate_comfyui_image(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Generate image using ComfyUI API"""
        # ComfyUI integration would require workflow definitions
        # This is a placeholder for future implementation
        raise NotImplementedError("ComfyUI integration not yet implemented")
    
    def vision_completion(self, image_data: bytes, prompt: str, model: Optional[str] = None) -> Union[str, Dict[str, Any]]:
        """
        Not applicable for image generation service.
        This service generates images, it doesn't analyze them.
        """
        raise NotImplementedError("Image generation service does not support vision completion")
    
    def _extract_prompt_from_messages(self, messages: List[Dict[str, Any]]) -> str:
        """Extract text prompt from chat messages format"""
        prompts = []
        for message in messages:
            if message.get('role') == 'user':
                content = message.get('content', '')
                if isinstance(content, str):
                    prompts.append(content)
                elif isinstance(content, list):
                    # Extract text from structured content
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'text':
                            prompts.append(item.get('text', ''))
        
        return " ".join(prompts) if prompts else "A beautiful landscape"
    
    def get_supported_sizes(self) -> List[str]:
        """Get supported image sizes for this provider"""
        if self.provider_type == 'openai_dalle':
            return ['1024x1024', '1792x1024', '1024x1792']
        elif self.provider_type == 'stability_ai':
            return ['512x512', '768x768', '1024x1024', '1536x1536']
        else:
            return ['512x512', '1024x1024']
    
    def get_supported_styles(self) -> List[str]:
        """Get supported styles for this provider"""
        if self.provider_type == 'openai_dalle':
            return ['vivid', 'natural']
        elif self.provider_type == 'stability_ai':
            return ['photographic', 'digital-art', 'comic-book', 'fantasy-art']
        else:
            return []
    
    def get_capabilities(self) -> Dict[str, bool]:
        """Get the capabilities of this image generation service"""
        return {
            "text_to_image": True,
            "image_to_image": self.provider_type != 'openai_dalle',  # Most support this except DALL-E
            "inpainting": self.provider_type != 'openai_dalle',
            "outpainting": self.provider_type != 'openai_dalle',
            "streaming": True,  # Simulated streaming
            "multiple_images": True,
            "style_control": len(self.get_supported_styles()) > 0,
            "size_control": True
        }