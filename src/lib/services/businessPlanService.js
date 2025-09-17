import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '../supabase.js';

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT || process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'planpolitai';

/**
 * Upload business plan to R2 storage and save metadata to Supabase
 */
export async function uploadBusinessPlan(file, onProgress) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `business-plans/${timestamp}_${sanitizedName}`;

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    if (onProgress) onProgress(50);

    await r2Client.send(uploadCommand);

    if (onProgress) onProgress(75);

    // Generate signed URL for access
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7 days

    // Save metadata to Supabase
    const { data: documentData, error } = await supabase
      .from('documents')
      .insert({
        original_filename: file.name,
        filename: fileName,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        document_type: 'business_plan',
        description: 'Uploaded business plan for grant matching',
        tags: ['business-plan', 'grant-matching'],
        storage_bucket: BUCKET_NAME,
        storage_path: fileName,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save document metadata:', error);
      throw new Error('Failed to save document metadata');
    }

    if (onProgress) onProgress(100);

    return {
      id: documentData.id,
      url: signedUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    };

  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Extract business plan data using OpenAI
 */
export async function extractBusinessPlanData(fileUrl) {
  try {
    const response = await fetch('/api/analyze-business-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze business plan');
    }

    const data = await response.json();
    return data.extractedData;

  } catch (error) {
    console.error('Business plan analysis failed:', error);
    // Return fallback data instead of failing completely
    return {
      businessName: 'Unable to extract',
      industry: 'Unable to extract',
      fundingAmount: 'Unable to extract',
      location: 'Unable to extract',
      businessStage: 'Unable to extract',
      targetMarket: 'Unable to extract',
      error: error.message,
    };
  }
}

/**
 * Get user's uploaded business plans
 */
export async function getUserBusinessPlans() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('document_type', 'business_plan')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch business plans: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Failed to get business plans:', error);
    throw error;
  }
}

/**
 * Delete business plan
 */
export async function deleteBusinessPlan(documentId) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete business plan: ${error.message}`);
    }

    return true;

  } catch (error) {
    console.error('Failed to delete business plan:', error);
    throw error;
  }
}

/**
 * Get download URL for business plan
 */
export async function getBusinessPlanDownloadUrl(fileName) {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 }); // 1 hour
    return signedUrl;

  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}