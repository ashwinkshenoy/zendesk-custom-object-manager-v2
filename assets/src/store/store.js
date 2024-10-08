import ZDClient from '../services/ZDClient.js';

Vue.use(Vuex);

const Store = new Vuex.Store({
  state: {
    objectState: 'Loading',
    objectTableState: 'Loading',
    isObjectRecordForm: false,
    objectUniqueKey: 0,
    objectTypes: [],
    selectedObjectType: '',
    schema: [],
    requiredFields: [],
    objectRecords: [],
    objectCursor: {
      prev: null,
      next: null,
      has_more: null,
    },
    paginationLastAction: '',
    selectedColumns: [],

    currentRecord: {},
    recordAction: 'new',

    searchText: '',
    relationState: 'Loading',
    relationTableState: 'Loading',
    relationUniqueKey: 0,
    relationTypes: [],
    selectedRelationType: '',
    relationRecords: [],
    relationCursor: {
      previous: null,
      next: null,
      current: null,
    },
    relationSearchText: '',
    isRelationshipRecordForm: false,

    order: {
      object: 1,
      relationship: 2,
    },
  },

  mutations: {
    SET_STATE(state, data) {
      state[data.key] = data.value;
    },
  },

  getters: {
    objectState: state => state.objectState,
    objectTableState: state => state.objectTableState,
    isObjectRecordForm: state => state.isObjectRecordForm,
    objectUniqueKey: state => state.objectUniqueKey,
    objectTypes: state => state.objectTypes,
    selectedObjectType: state => state.selectedObjectType,
    schema: state => state.schema,
    requiredFields: state => state.requiredFields,
    objectRecords: state => state.objectRecords,
    objectCursor: state => state.objectCursor,
    paginationLastAction: state => state.paginationLastAction,
    searchText: state => state.searchText,
    selectedColumns: state => state.selectedColumns,

    currentRecord: state => state.currentRecord,
    recordAction: state => state.recordAction,

    relationState: state => state.relationState,
    relationTableState: state => state.relationTableState,
    relationUniqueKey: state => state.relationUniqueKey,
    relationTypes: state => state.relationTypes,
    selectedRelationType: state => state.selectedRelationType,
    relationRecords: state => state.relationRecords,
    relationCursor: state => state.relationCursor,
    relationSearchText: state => state.relationSearchText,
    isRelationshipRecordForm: state => state.isRelationshipRecordForm,

    order: state => state.order,
  },

  actions: {
    setState({ commit }, value) {
      commit('SET_STATE', value);
    },

    /**
     * Get Object Types
     * @param {Object} param0
     * @returns
     */
    async getObjectTypes({ dispatch }) {
      try {
        dispatch('setState', { key: 'objectState', value: 'Loading' });
        const response = await ZDClient.customObject().objects();
        console.log('---Objects---\n', response);
        if (response.custom_objects.length === 0) {
          dispatch('setState', { key: 'objectState', value: 'NoObjects' });
          return;
        }
        dispatch('setState', { key: 'objectTypes', value: response.custom_objects });
        dispatch('setState', { key: 'selectedObjectType', value: response.custom_objects[0].key });
        dispatch('setState', { key: 'objectState', value: 'ObjectsFound' });
        return Promise;
      } catch (error) {
        console.error(error);
        dispatch('setState', { key: 'objectState', value: 'NoObjects' });
        dispatch('setState', { key: 'relationState', value: 'NoRelationTypes' });
        throw error;
      }
    },

    /**
     * Get Relationship Types
     * @param {Object} param0
     * @returns
     */
    async getRelationshipTypes({ dispatch }) {
      try {
        dispatch('setState', { key: 'relationState', value: 'Loading' });
        const response = await ZDClient.customObject().relationTypes();
        console.log('---Relationship Types---\n', response);
        if (response.data.length === 0) {
          dispatch('setState', { key: 'relationState', value: 'NoRelationTypes' });
          return;
        }
        dispatch('setState', { key: 'relationTypes', value: response.data });
        dispatch('setState', { key: 'selectedRelationType', value: response.data[0].key });
        dispatch('setState', { key: 'relationState', value: 'RelationTypesFound' });
        return Promise;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    /**
     * Get Object Schema
     * @param {Object}
     * @param {String} cursor
     */
    async getObjectSchema({ state, dispatch }) {
      const schema = await ZDClient.customObject().schema(state.selectedObjectType);
      const currentSchema = schema.custom_object_fields;
      await dispatch('setState', { key: 'schema', value: currentSchema });
      console.log('---Schema---\n', currentSchema);
    },

    /**
     * Get Object Records
     * @param {Object}
     * @param {String} cursor
     */
    async getObjectRecords({ state, dispatch }, cursor = null) {
      dispatch('setState', { key: 'objectTableState', value: 'Loading' });
      try {
        const response = await ZDClient.customObject().read(state.selectedObjectType, cursor);
        console.log('---All Object Records---\n', response);
        await dispatch('setState', { key: 'objectRecords', value: response.custom_object_records });
        await dispatch('setState', { key: 'objectTableState', value: 'DataFound' });
        if (response.custom_object_records.length === 0) {
          dispatch('setState', { key: 'objectTableState', value: 'NoData' });
        }
        const cursorValue = {
          ...response.links,
          ...response.meta,
        };
        dispatch('setState', { key: 'objectCursor', value: cursorValue });
        // console.table({ ...state.objectCursor });
      } catch (error) {
        console.error(error);
        dispatch('setState', { key: 'objectTableState', value: 'ApiError' });
      }
    },

    /**
     * Search Object
     * @param {Object}
     * @param {String} cursor
     */
    async searchCO({ state, dispatch }, cursor = null) {
      dispatch('setState', { key: 'objectTableState', value: 'Loading' });
      try {
        const response = await ZDClient.customObject().search(state.selectedObjectType, cursor, state.searchText);
        console.log('---Search Records---\n', response);

        const records = response.custom_object_records;
        dispatch('setState', { key: 'objectRecords', value: records });

        let appState = 'DataFound';
        if (records.length === 0) {
          appState = 'NoData';
        }
        dispatch('setState', { key: 'objectTableState', value: appState });

        const cursorValue = {
          ...response.links,
          ...response.meta,
        };
        dispatch('setState', { key: 'objectCursor', value: cursorValue });
      } catch (error) {
        console.error(error);
        dispatch('setState', { key: 'objectTableState', value: 'ApiError' });
      }
    },

    /**
     * Get Relationship Records
     * @param {Object}
     * @param {String} cursor
     */
    async getRelationshipRecords({ state, dispatch }, cursor = null) {
      dispatch('setState', { key: 'relationTableState', value: 'Loading' });
      try {
        if (!state.selectedRelationType) {
          return;
        }
        const response = await ZDClient.customObject().relationRecords(
          state.selectedRelationType,
          cursor || state.relationCursor.current,
        );
        console.log('---All Relationship Records---\n', response);
        await dispatch('setState', { key: 'relationRecords', value: response.data });
        await dispatch('setState', { key: 'relationTableState', value: 'DataFound' });
        if (response.data.length === 0) {
          dispatch('setState', { key: 'relationTableState', value: 'NoData' });
        }
        dispatch('setState', {
          key: 'relationCursor',
          value: { ...response.links, current: cursor || state.relationCursor.current },
        });
      } catch (error) {
        console.error(error);
        dispatch('setState', { key: 'relationTableState', value: 'ApiError' });
      }
    },
  },
});

export default Store;
