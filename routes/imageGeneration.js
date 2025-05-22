const express = require('express');
const router = express.Router();
const { generateImageWithStabilityAI } = require('../services/stabilityAiService');
const { validatePayload } = require('../utils/validators');

/**
 * POST /api/generate-sigil-vision
 * Generates an AI image based on the sigil image and text prompts
 */
router.post('/generate-sigil-vision', async (req, res) => {
  console.log('--- Received request for /generate-sigil-vision ---');
  console.log('Request body (req.body):', JSON.stringify(req.body, null, 2));
  console.log('Server file paths:');
  console.log('- Current route file:', __filename);
  console.log('- stabilityAiService location:', require.resolve('../services/stabilityAiService'));

  try {
    // Validate the incoming payload
    const { isValid, errors } = validatePayload(req.body);
    if (!isValid) {
      console.error('Validation failed:', errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errorDetails: errors
      });
    }

    console.log('Validation passed.');

    const { sigilImageData, originalIntention, styleKeywords, aiParameters = {} } = req.body;

    console.log('Extracted sigilImageData (first 100 chars):', sigilImageData ? sigilImageData.substring(0, 100) : 'sigilImageData is undefined or null');
    console.log('Type of sigilImageData:', typeof sigilImageData);

    console.log('Calling generateImageWithStabilityAI...');
    const result = await generateImageWithStabilityAI(
      sigilImageData,
      originalIntention,
      styleKeywords,
      aiParameters
    );
    console.log('generateImageWithStabilityAI returned.');

    // Improved return statement: dynamically set status code based on result.success
    // Assumes `result` object from service includes a `success` boolean property.
    if (result && typeof result.success === 'boolean') {
        return res.status(result.success ? 200 : 500).json(result);
    } else {
        // Fallback if result or result.success is not as expected
        console.error('Unexpected result structure from generateImageWithStabilityAI:', result);
        return res.status(500).json({
            success: false,
            message: 'Internal server error: Unexpected response from AI service.'
        });
    }

  } catch (error) {
    console.error('Error in /generate-sigil-vision route:', error.message); 
    console.error('Error stack:', error.stack); 
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during image generation.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;
