const axios = require('axios');
// Using form-data for Node.js environment
const FormData = require('form-data');

// Helper function to safely access form data or parameters
function getParamValue(aiParams, paramName, defaultValue) {
  if (!aiParams) return defaultValue;
  return aiParams[paramName] !== undefined ? aiParams[paramName] : defaultValue;
}

/**
 * Generates an image using Stability AI's text-to-image API instead of img2img
 * This is a simplified implementation that may work better with basic accounts
 * @param {string} sigilImageData - Base64 encoded image data (not used in this implementation)
 * @param {string} originalIntention - User's original intention text
 * @param {string} styleKeywords - Additional style keywords
 * @param {object} aiParameters - Optional parameters for the AI
 * @returns {Promise<object>} - Object containing the generated image URL
 */
async function generateImageWithStabilityAI(sigilImageData, originalIntention, styleKeywords, aiParameters = {}) {
  try {
    console.log('Starting Stability AI image-to-image generation... (v2.0)');
    console.log('stabilityAiService.js file path:', __filename);

    if (!sigilImageData) {
      throw new Error('Initial image data (sigilImageData) is required for image-to-image generation.');
    }

    const engineId = 'stable-diffusion-xl-1024-v1-0';
    const apiHost = 'https://api.stability.ai';
    const url = `${apiHost}/v1/generation/${engineId}/image-to-image`;
    
    console.log('Using Stability AI image-to-image endpoint:', url);

    const formData = new FormData();

    // Prepare and append init_image
    const base64Image = sigilImageData.includes(',') ? sigilImageData.split(',')[1] : sigilImageData;
    const imageBuffer = Buffer.from(base64Image, 'base64');
    formData.append('init_image', imageBuffer, { filename: 'init_image.png', contentType: 'image/png' });
    
    // Create and append text prompts
    const promptText = `A mystical sigil representing: "${originalIntention}". Style: ${styleKeywords}`;
    console.log('Using text prompt:', promptText);
    formData.append('text_prompts[0][text]', promptText);
    formData.append('text_prompts[0][weight]', 1.0);

    if (aiParameters.negativePrompt) {
      console.log('Using negative prompt:', aiParameters.negativePrompt);
      formData.append('text_prompts[1][text]', aiParameters.negativePrompt);
      formData.append('text_prompts[1][weight]', -1.0);
    }

    // Append other parameters - using our helper function for safety
    formData.append('image_strength', getParamValue(aiParameters, 'imageStrength', 0.35));
    formData.append('init_image_mode', getParamValue(aiParameters, 'initImageMode', 'IMAGE_STRENGTH'));
    formData.append('cfg_scale', getParamValue(aiParameters, 'cfgScale', 7));
    formData.append('samples', getParamValue(aiParameters, 'samples', 1));
    formData.append('steps', getParamValue(aiParameters, 'steps', 30));
    // Optional: Add sampler, e.g., formData.append('sampler', 'K_DPM_2_ANCESTRAL');
    // Optional: Add style_preset for specific artistic styles if supported by image-to-image on this model.

    // console.log('FormData prepared. Keys:', Object.keys(formData._streams || {}).join(', ')); // For debugging FormData content
    
    console.log('Sending request to Stability AI...');
    const startTime = Date.now();

    const headers = {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${process.env.STABILITY_AI_API_KEY}`,
      'Accept': 'application/json'
    };
    
    if (process.env.STABILITY_AI_ORG_ID && process.env.STABILITY_AI_ORG_ID.trim() !== '') {
      headers['Organization'] = process.env.STABILITY_AI_ORG_ID;
      console.log('Using organization ID:', process.env.STABILITY_AI_ORG_ID);
    }
    
    console.log('Sending request to:', url);
    try {
      const response = await axios({
        method: 'post',
        url: url,
        headers: headers,
        data: formData
      });

      console.log('Received response from Stability AI');
      const duration = Date.now() - startTime;
      // console.log('API response data:', JSON.stringify(response.data, null, 2)); // Full response for debugging
      
      if (response.data && response.data.artifacts && response.data.artifacts.length > 0) {
        const artifact = response.data.artifacts[0];
        if (artifact.finishReason === 'SUCCESS' || artifact.finishReason === 'CONTENT_FILTERED') {
            const imageUrl = `data:image/png;base64,${artifact.base64}`;
            console.log(`Image data successfully received. Finish reason: ${artifact.finishReason}, Seed: ${artifact.seed}`);
            if (artifact.finishReason === 'CONTENT_FILTERED') {
                console.warn('Warning: The generated image was altered due to content filtering.');
            }
            return {
              success: true,
              imageUrl,
              aiProviderInfo: {
                modelUsed: `${engineId}/image-to-image`,
                durationMs: duration,
                prompt: promptText,
                imageStrength: getParamValue(aiParameters, 'imageStrength', 0.35),
                steps: getParamValue(aiParameters, 'steps', 30),
                cfgScale: getParamValue(aiParameters, 'cfgScale', 7),
                seed: artifact.seed,
                finishReason: artifact.finishReason
              }
            };
        } else {
            console.error('Image generation failed or was incomplete. Finish reason:', artifact.finishReason, 'Details:', artifact.error || 'No additional error details.');
            throw new Error(`Image generation failed with reason: ${artifact.finishReason}. ${artifact.error || ''}`);
        }
      } else {
        console.error('Unexpected response format or no artifacts:', response.data);
        throw new Error('Unexpected response format or no artifacts from Stability AI');
      }
    } catch (axiosError) {
      console.error('Axios error during API call:', axiosError.message);
      if (axiosError.response) {
        console.error('Full error response status:', axiosError.response.status);
        console.error('Full error response data:', JSON.stringify(axiosError.response.data, null, 2));
        // More specific error message construction from response data
        const errorData = axiosError.response.data;
        let apiMessage = 'Error from Stability AI API.';
        if (errorData && errorData.message) {
          apiMessage = errorData.message;
        } else if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
          apiMessage = errorData.errors.join(' ');
        }
        throw new Error(`API Error (${axiosError.response.status}): ${apiMessage}`);
      }
      throw axiosError; // Re-throw if not handled above
    }
  } catch (error) {
    console.error('Stability AI service error (image-to-image):', error.message);
    // Ensure a clear error is propagated
    if (error.message.startsWith('API Error')) {
        throw error; // Propagate API specific error
    } else if (error.response && error.response.status === 401) { // Check for direct error object properties if not an Axios error
        throw new Error('Authentication failed: Please check your API key');
    }
    // Fallback for other types of errors or if error.response is not set as expected
    throw new Error(`Stability AI service failed: ${error.message || 'Unknown error'}`);
  }
}

module.exports = {
  generateImageWithStabilityAI
};


