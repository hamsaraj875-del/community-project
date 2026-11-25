const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Verify a complaint's image against its category & title using the Python CLIP AI microservice.
 * @param {Buffer} imageBuffer - In-memory image file buffer
 * @param {string} originalname - Original file name for mimetype detection
 * @param {string} mimetype - Image mimetype (e.g. image/jpeg)
 * @param {string} category - Civic category
 * @param {string} title - Complaint title
 * @param {string} description - Complaint description
 * @returns {Promise<{ verificationStatus: string, verificationScore: number|null, verificationReason: string }>}
 */
async function verifyComplaintImage(imageBuffer, originalname, mimetype, category, title, description) {
  try {
    const form = new FormData();
    form.append('category', category || '');
    if (title) form.append('title', title);
    if (description) form.append('description', description);
    form.append('image', imageBuffer, {
      filename: originalname || 'complaint.jpg',
      contentType: mimetype || 'image/jpeg',
    });

    const res = await axios.post(`${AI_SERVICE_URL}/verify`, form, {
      headers: form.getHeaders(),
      timeout: 15000, // 15-second timeout
    });

    if (res.data && res.data.success) {
      return {
        verificationStatus: res.data.status,
        verificationScore: res.data.match_score,
        verificationReason: res.data.reason,
        verifiedAt: new Date(),
      };
    }

    return {
      verificationStatus: 'needs_review',
      verificationScore: null,
      verificationReason: 'AI service returned non-standard response; queued for manual review.',
      verifiedAt: new Date(),
    };
  } catch (err) {
    console.warn(`[CivicVision AI] Verification service warning: ${err.message}`);
    // Graceful degradation: never block complaint creation if AI service is offline
    return {
      verificationStatus: 'verification_failed',
      verificationScore: null,
      verificationReason: 'AI verification service temporarily unreachable. Submitted for manual review.',
      verifiedAt: new Date(),
    };
  }
}

module.exports = {
  verifyComplaintImage,
  AI_SERVICE_URL,
};
