let CLIENT = {};
let APP_SETTINGS = {};
let SUB_DOMAIN;

const ZDClient = {
  events: {
    ON_APP_REGISTERED(cb) {
      if (!CLIENT) {
        window.location.href = '/zendesk-custom-object-manager/';
      }
      return CLIENT.on('app.registered', async data => {
        SUB_DOMAIN = data.context.account.subdomain;
        APP_SETTINGS = data.metadata.settings;
        return cb(data);
      });
    },
  },

  init() {
    CLIENT = ZAFClient.init();
  },

  /**
   * Set getters for private objects
   */
  app: {
    get settings() {
      return APP_SETTINGS;
    },

    get domain() {
      return SUB_DOMAIN;
    },

    /**
     * It returns true if the app is installed in the instance, false if
     * it's running locally
     */
    get isProduction() {
      return !!this.settings.IS_PRODUCTION;
    },
  },

  /**
   * Calls ZAF Client.request()
   * @returns {Promise}
   */
  async request(url, data, options = {}) {
    return await CLIENT.request({
      url,
      data,
      cache: false,
      secure: APP_SETTINGS.IS_PRODUCTION,
      contentType: 'application/json',
      ...options,
    });
  },

  /**
   * Invoke Notification
   * @param {String} type
   * @param {String} message
   * @param {Number} durationInMs
   */
  notify(type = 'notice', message, durationInMs = 5000) {
    CLIENT.invoke('notify', message, type, durationInMs);
  },

  /**
   * Custom Object Operations
   * @returns {Object} Instance
   */
  customObject() {
    const instance = {};

    /**
     * Get all custom objects
     * @returns {Object}
     */
    instance.objects = () => {
      return this.request(
        `/api/v2/custom_objects`,
        {},
        {
          method: 'GET',
        },
      );
    };

    /**
     * Get schema for the passed object
     * @param {String} object
     * @returns {Object}
     */
    instance.schema = object => {
      return this.request(
        `/api/v2/custom_objects/${object}/fields`,
        {},
        {
          method: 'GET',
        },
      );
    };

    /**
     * API call to create record
     * @param {Object} payload
     * @returns {Object}
     */
    instance.create = (objectName, payload) => {
      return this.request(`/api/v2/custom_objects/${objectName}/records`, JSON.stringify(payload), {
        method: 'POST',
      });
    };

    /**
     * API call to read "asset" records
     * Cursor pagination
     * @param {String} objectName
     * @param {Number} cursorUrl
     * @returns {Object}
     */
    instance.read = (objectName, cursorUrl = null, count = null) => {
      return this.request(
        cursorUrl
          ? cursorUrl
          : `/api/v2/custom_objects/${objectName}/records?page[size]=${
              count || this.app.settings.noOfRecords
            }&sort=-id`,
        null,
        {
          method: 'GET',
        },
      );
    };

    /**
     * API call to update record
     * @param {Object} payload
     * @returns {Object}
     */
    instance.update = (objectName, id, payload) => {
      return this.request(`/api/v2/custom_objects/${objectName}/records/${id}`, JSON.stringify(payload), {
        method: 'PATCH',
        contentType: 'application/json',
      });
    };

    /**
     * API call to delete record
     * @param {String} objectName
     * @param {String} id
     * @returns {Object}
     */
    instance.delete = (objectName, id) => {
      return this.request(
        `/api/v2/custom_objects/${objectName}/records/${id}`,
        {},
        {
          method: 'DELETE',
        },
      );
    };

    /**
     * API call to search records
     * @param {String} objectName
     * @param {String} cursorUrl
     * @param {String} searchQuery
     * @returns {Object}
     */
    instance.search = (objectName, cursorUrl, searchQuery) => {
      return this.request(
        cursorUrl
          ? cursorUrl
          : `/api/v2/custom_objects/${objectName}/records/search?page[size]=100&query=${searchQuery}`,
        {},
        {
          method: 'GET',
        },
      );
    };

    /**
     * API call to get relationship types
     * @param {Object} payload
     * @returns {Object}
     */
    instance.relationTypes = payload => {
      return this.request('/api/sunshine/relationships/types', JSON.stringify(payload), {
        method: 'GET',
      });
    };

    /**
     * API call to get relationship types
     * @param {Object} payload
     * @returns {Object}
     */
    instance.relationRecords = (relationshipName, cursorUrl = null, count = null) => {
      return this.request(
        cursorUrl
          ? cursorUrl
          : `/api/sunshine/relationships/records?type=${relationshipName}&per_page=${
              count || this.app.settings.noOfRecords
            }&order=desc`,
        {},
        {
          method: 'GET',
        },
      );
    };

    /**
     * API call to create record
     * @param {Object} payload
     * @returns {Object}
     */
    instance.createRelationshipRecord = payload => {
      return this.request('/api/sunshine/relationships/records', JSON.stringify(payload), {
        method: 'POST',
      });
    };

    /**
     * API call to delete record
     * @param {Object} payload
     * @returns {Object}
     */
    instance.deleteRelationshipRecord = id => {
      return this.request(
        `/api/sunshine/relationships/records/${id}`,
        {},
        {
          method: 'DELETE',
        },
      );
    };

    /**
     * Create ZD jobs
     * @param {Array} recordsId
     * @param {String} type
     * @param {String} action
     * @returns {Object}
     */
    instance.createJob = (objectName, action, records) => {
      const requestData = {
        job: {
          action: action,
          items: records,
        },
      };
      return this.request(`/api/v2/custom_objects/${objectName}/jobs`, JSON.stringify(requestData), {
        method: 'POST',
      });
    };

    /**
     * Get ZD job status
     * @param {Integer} id
     * @returns {Object}
     */
    instance.getJobStatus = id => {
      return this.request(
        `/api/v2/job_statuses/${id}`,
        {},
        {
          method: 'GET',
        },
      );
    };

    return instance;
  },
};

export default ZDClient;
