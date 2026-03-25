/**
 * MongoDB Data API wrapper
 * Replaces direct Mongoose driver calls
 * Uses HTTP/REST API instead
 */

export class MongoDataAPI {
  constructor(apiKey, appId, dataSource = 'Campus-Connect') {
    this.apiKey = apiKey;
    this.appId = appId;
    this.dataSource = dataSource;
    this.baseUrl = 'https://data.mongodb-api.com/app';
  }

  /**
   * Generic request handler
   */
  async request(method, collection, payload) {
    const url = `${this.baseUrl}/${this.appId}/endpoint/data/v1/action/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Request-Headers': '*',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          dataSource: this.dataSource,
          database: 'Campus-Connect',
          collection,
          ...payload
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`MongoDB API Error: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[MongoDB API] ${method} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Find documents
   */
  async find(collection, query = {}, options = {}) {
    const payload = {
      filter: query,
      ...(options.limit && { limit: options.limit }),
      ...(options.skip && { skip: options.skip }),
      ...(options.sort && { sort: options.sort })
    };

    return this.request('find', collection, payload);
  }

  /**
   * Find one document
   */
  async findOne(collection, query) {
    const result = await this.request('findOne', collection, {
      filter: query
    });
    return result.document;
  }

  /**
   * Insert one document
   */
  async insertOne(collection, document) {
    const result = await this.request('insertOne', collection, {
      document
    });
    return result;
  }

  /**
   * Insert multiple documents
   */
  async insertMany(collection, documents) {
    const result = await this.request('insertMany', collection, {
      documents
    });
    return result;
  }

  /**
   * Update one document
   */
  async updateOne(collection, filter, update) {
    const result = await this.request('updateOne', collection, {
      filter,
      update: {
        $set: update
      }
    });
    return result;
  }

  /**
   * Update many documents
   */
  async updateMany(collection, filter, update) {
    const result = await this.request('updateMany', collection, {
      filter,
      update: {
        $set: update
      }
    });
    return result;
  }

  /**
   * Replace one document
   */
  async replaceOne(collection, filter, replacement) {
    const result = await this.request('replaceOne', collection, {
      filter,
      replacement
    });
    return result;
  }

  /**
   * Delete one document
   */
  async deleteOne(collection, filter) {
    const result = await this.request('deleteOne', collection, {
      filter
    });
    return result;
  }

  /**
   * Delete many documents
   */
  async deleteMany(collection, filter) {
    const result = await this.request('deleteMany', collection, {
      filter
    });
    return result;
  }

  /**
   * Count documents
   */
  async countDocuments(collection, query = {}) {
    const result = await this.request('count', collection, {
      query
    });
    return result.count;
  }

  /**
   * Simple aggregation (limited support)
   * NOTE: Data API aggregation is NOT full MongoDB aggregation
   */
  async aggregate(_collection, _pipeline) {
    console.warn('[MongoDB API] Aggregation pipeline may be limited');
    // Data API doesn't have full aggregation support
    // For complex aggregations, fetch data and process in code
    throw new Error('Aggregation not supported via MongoDB Data API - fetch documents and process in code');
  }
}

/**
 * Create singleton instance
 */
let mongoInstance = null;

export function initMongoDB(apiKey, appId) {
  mongoInstance = new MongoDataAPI(apiKey, appId);
  return mongoInstance;
}

export function getMongoDB() {
  if (!mongoInstance) {
    throw new Error('MongoDB not initialized. Call initMongoDB first.');
  }
  return mongoInstance;
}

export default MongoDataAPI;
