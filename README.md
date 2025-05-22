# Dürer's Sigil Weaver Backend

A backend service for Tonic Thought Studio's Dürer's Sigil Weaver application. This service receives a user's personalized sigil, intention phrase, and style keywords, then transforms them into an AI-generated image using Stability AI's img2img API.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   STABILITY_AI_API_KEY=your_stability_ai_key_here
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### POST /api/generate-sigil-vision

Generates an AI image based on the sigil image and text prompts.

#### Request Body

```json
{
  "sigilImageData": "data:image/png;base64,iVBORw0KGgoAAAANS...", 
  "originalIntention": "My Creative Power Flows",
  "styleKeywords": "ethereal glow, cosmic nebula, vibrant colors",
  "aiParameters": { 
    "imageStrength": 0.35, 
    "cfgScale": 7,
    "steps": 50,
    "seed": 12345,
    "negativePrompt": "blurry, low quality, text"
  }
}
```

#### Response

Success (HTTP 200):
```json
{
  "success": true,
  "imageUrl": "https://url.to.the.ai.generated.image.jpg",
  "message": "Image generated successfully.",
  "aiProviderInfo": {
    "modelUsed": "stable-diffusion-xl-1024-v1-0",
    "durationMs": 15000,
    "seed": 12345
  }
}
```

Failure (HTTP 4xx/5xx):
```json
{
  "success": false,
  "imageUrl": null,
  "message": "An error occurred: [User-friendly error message]",
  "errorDetails": "[More technical error details]"
}
```

## Answers to Key Questions

### Endpoint & Authentication

- **Endpoint URL**: `http://localhost:3000/api/generate-sigil-vision` for local development. For production, this will depend on your hosting environment.
- **Authentication**: The endpoint itself does not require authentication from the frontend. The Stability AI API key is stored securely on the server in environment variables and is not exposed to the client.

### AI Image Generation Service

- **Service Used**: Stability AI's img2img API with the stable-diffusion-xl-1024-v1-0 model.
- **img2img capabilities**: Yes, the API accepts a base64 encoded image as the `init_image` parameter.
- **Output image dimensions**: The output images will be 1024x1024 pixels in PNG format.

### AI Parameters

The frontend can control the following parameters via the `aiParameters` object:

- `imageStrength`: Controls adherence to the initial image (0-1, where lower values preserve more of the original sigil)
- `cfgScale`: Controls how strictly the prompt is followed (0-35)
- `steps`: Number of diffusion steps (10-150)
- `seed`: For reproducible results (integer)
- `negativePrompt`: Guides the AI away from unwanted elements

### Error Handling & Reporting

Specific errors from the AI service are translated as follows:

- Content moderation block: "Content policy violation: [details]"
- Out of credits: "AI service quota exceeded or payment required."
- Invalid prompt: "Invalid request to AI service: [details]"

### Performance & Timeouts

- **Expected latency**: Typically 5-15 seconds depending on the complexity of the generation.
- **Timeout settings**: The server has a 60-second timeout for AI service requests.

### Development & Testing

- **Testing endpoint**: During development, use the local endpoint (`http://localhost:3000/api/generate-sigil-vision`).
- **API call logs**: API calls and errors are logged to the console. For more detailed logging, check the server logs.
