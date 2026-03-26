// src/backend/services/s3Service.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

class S3Service {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'seeu-daters-payments';
    this.urlExpiration = 24 * 60 * 60; // 24 hours
  }

  /**
   * Upload file to S3
   */
  async uploadFile(fileBuffer, key, contentType) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
        ACL: 'private',
        Metadata: {
          'upload-timestamp': new Date().toISOString()
        }
      };

      const result = await s3.upload(params).promise();
      
      console.log(`File uploaded to S3: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Generate signed URL for downloading file
   */
  async getSignedUrl(key, expiresIn = this.urlExpiration) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      const signedUrl = await s3.getSignedUrlPromise('getObject', params);
      
      return signedUrl;
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Get signing URL for client-side upload
   */
  async getUploadSignedUrl(key, contentType, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
        ServerSideEncryption: 'AES256'
      };

      const signedUrl = await s3.getSignedUrlPromise('putObject', params);
      
      return signedUrl;
    } catch (error) {
      console.error('S3 upload signed URL error:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await s3.deleteObject(params).promise();
      
      console.log(`File deleted from S3: ${key}`);
      
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const metadata = await s3.headObject(params).promise();
      
      return {
        size: metadata.ContentLength,
        contentType: metadata.ContentType,
        lastModified: metadata.LastModified,
        etag: metadata.ETag
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Copy file within S3
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        ServerSideEncryption: 'AES256'
      };

      await s3.copyObject(params).promise();
      
      console.log(`File copied in S3: ${sourceKey} -> ${destinationKey}`);
      
      return true;
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('Failed to copy file in S3');
    }
  }

  /**
   * List files in S3
   */
  async listFiles(prefix, maxKeys = 100) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await s3.listObjectsV2(params).promise();
      
      return result.Contents || [];
    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error('Failed to list files in S3');
    }
  }

  /**
   * Upload file with automatic cleanup
   * Deletes old file if new upload succeeds
   */
  async replaceFile(oldKey, newFileBuffer, newKey, contentType) {
    try {
      // Upload new file
      const newLocation = await this.uploadFile(newFileBuffer, newKey, contentType);

      // Delete old file
      if (oldKey) {
        try {
          await this.deleteFile(oldKey);
        } catch {
          console.warn('Warning: Failed to delete old file:', oldKey);
          // Don't fail the operation if cleanup fails
        }
      }

      return newLocation;
    } catch (error) {
      console.error('S3 replace file error:', error);
      throw error;
    }
  }

  /**
   * Batch delete files
   */
  async deleteFiles(keys) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key }))
        }
      };

      await s3.deleteObjects(deleteParams).promise();
      
      console.log(`${keys.length} files deleted from S3`);
      
      return true;
    } catch (error) {
      console.error('S3 batch delete error:', error);
      throw new Error('Failed to delete files from S3');
    }
  }
}

module.exports = new S3Service();

