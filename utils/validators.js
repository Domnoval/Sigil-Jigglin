/**
 * Validates the incoming payload for the image generation endpoint
 * @param {object} payload - The request payload
 * @returns {object} - Object with validation result and errors
 */
function validatePayload(payload) {
  const errors = [];

  // Check if required fields exist
  if (!payload) {
    errors.push('No payload provided');
    return { isValid: false, errors };
  }

  // Validate sigilImageData
  if (!payload.sigilImageData) {
    errors.push('Missing required field: sigilImageData');
  } else if (typeof payload.sigilImageData !== 'string') {
    errors.push('sigilImageData must be a string');
  } else if (!payload.sigilImageData.startsWith('data:image/')) {
    errors.push('sigilImageData must be a valid base64 encoded image string');
  }

  // Validate originalIntention
  if (!payload.originalIntention) {
    errors.push('Missing required field: originalIntention');
  } else if (typeof payload.originalIntention !== 'string') {
    errors.push('originalIntention must be a string');
  }

  // Validate styleKeywords
  if (!payload.styleKeywords) {
    errors.push('Missing required field: styleKeywords');
  } else if (typeof payload.styleKeywords !== 'string') {
    errors.push('styleKeywords must be a string');
  }

  // Validate aiParameters if provided
  if (payload.aiParameters && typeof payload.aiParameters !== 'object') {
    errors.push('aiParameters must be an object');
  }

  // Optional: validate specific aiParameters
  if (payload.aiParameters) {
    const { imageStrength, cfgScale, steps, seed, negativePrompt } = payload.aiParameters;
    
    if (imageStrength !== undefined && (typeof imageStrength !== 'number' || imageStrength < 0 || imageStrength > 1)) {
      errors.push('aiParameters.imageStrength must be a number between 0 and 1');
    }
    
    if (cfgScale !== undefined && (typeof cfgScale !== 'number' || cfgScale < 0 || cfgScale > 35)) {
      errors.push('aiParameters.cfgScale must be a number between 0 and 35');
    }
    
    if (steps !== undefined && (typeof steps !== 'number' || steps < 10 || steps > 150)) {
      errors.push('aiParameters.steps must be a number between 10 and 150');
    }
    
    if (seed !== undefined && (typeof seed !== 'number' || !Number.isInteger(seed))) {
      errors.push('aiParameters.seed must be an integer');
    }
    
    if (negativePrompt !== undefined && typeof negativePrompt !== 'string') {
      errors.push('aiParameters.negativePrompt must be a string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePayload
};
