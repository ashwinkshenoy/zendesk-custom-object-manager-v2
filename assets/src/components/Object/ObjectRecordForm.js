const template = `
<div class="sidebar">
  <div class="sidebar__title-wrapper u-p">
    <h3 class="type-title u-mb-xxs">
      <span v-if="recordAction === 'new'">Create Record</span>
      <span v-if="recordAction === 'edit'">Update Record</span>
    </h3>
    <div @click="closeForm">
      <garden-icon icon="zd-close" name="Close" class="close-icon"></garden-icon>
    </div>
  </div>

  <form @submit.prevent="setRecord" class="u-ph">
    <!--Type: String/Number/Integer-->
    <div class="row">
      <template v-for="(column, index) in getDefaultKeys">
        <div class="col-6 form-element" :key="'column_'+index">
          <label :for="column.key" class="c-txt__label u-capitalize">
            {{ column.raw_title | column.key }}
            <span class="u-fg-crimson-600" v-if="isRequired(column.key)">*</span>
            <template v-if="column.raw_description">
              <small class="u-fg-grey-500 u-regular">({{ column.raw_description }})</small>
            </template>
          </label>
          <template v-if="column.type === 'number' || column.type === 'integer'">
            <input
              type="number"
              class="c-txt__input c-txt__input--sm"
              autocomplete="off"
              :id="column.key"
              v-model.number="form[column.key]">
          </template>
          <template v-else>
            <textarea
              type="text"
              class="c-txt__input c-txt__input--sm"
              rows="1"
              v-model="form[column.key]"
              :id="column.key"
              :required="isRequired(column.key)"></textarea>
          </template>
        </div>
      </template>
    </div>

    <!--Type: Boolean-->
    <div class="row u-mt-sm" v-if="getBooleanKeys.length > 0">
      <template v-for="(column, index) in getBooleanKeys">
        <div class="col-4 form-element u-mb-xl" :key="'column_'+index">
          <div class="form-element">
            <label class="c-txt__label u-capitalize">
              {{ column.raw_title | column.key }}
              <template v-if="column.raw_description">
                <small class="u-fg-grey-500 u-regular">({{ column.raw_description }})</small>
              </template>
            </label>
            <input
              class="c-chk__input"
              type="checkbox"
              v-model="form[column.key]"
              :id="column.key">
            <label class="c-chk__label c-chk__label--toggle" :for="column.key"></label>
          </div>
        </div>
      </template>
    </div>

    <div class="u-mv">
      <vs-button class="u-mr-sm" size="small" @click="closeForm">Cancel</vs-button>
      <vs-button size="small" fill type="submit" :disabled="isLoading">Save</vs-button>
    </div>
  </form>
</div>
`;

import GardenIcon from '../Common/GardenIcon.js';
import ZDClient from '../../services/ZDClient.js';

const ObjectRecordForm = {
  template,

  components: {
    GardenIcon,
  },

  data() {
    return {
      form: {},
      isLoading: false,
    };
  },

  computed: {
    ...Vuex.mapGetters([
      'schema',
      'selectedObjectType',
      'requiredFields',
      'objectUniqueKey',
      'recordAction',
      'currentRecord',
      'objectCursor',
    ]),

    /**
     * Get all strings from schema
     * @returns {Array}
     */
    getDefaultKeys() {
      let schema = Object.entries(this.schema).reduce(function (result, [key, value]) {
        if (value.type !== 'checkbox') {
          result.push(...[{ ...value }]);
        }
        return result;
      }, []);
      const defaultKeys = [
        { key: 'name', raw_title: 'name', raw_description: '' },
        { key: 'external_id', raw_title: 'External ID', raw_description: '' },
      ];
      schema = [...defaultKeys, ...schema];
      return schema;
    },

    /**
     * Get all booleans from schema
     * @returns {Array}
     */
    getBooleanKeys() {
      return Object.entries(this.schema).reduce(function (result, [key, value]) {
        if (value.type === 'checkbox') {
          result.push(...[{ ...value }]);
        }
        return result;
      }, []);
    },
  },

  mounted() {
    this.init();
  },

  watch: {
    currentRecord() {
      this.init();
    },
  },

  methods: {
    ...Vuex.mapActions(['setState']),

    init() {
      if (this.recordAction === 'edit') {
        console.log('---Record Action---\n', this.recordAction);
        console.log('---Current Record---\n', { ...this.currentRecord });
        this.form = {
          name: this.currentRecord.name,
          external_id: this.currentRecord.external_id,
          ...this.currentRecord.custom_object_fields,
        };
      }
      if (this.recordAction === 'new') {
        this.form = { ...{} };
      }
    },

    /**
     * Close sidebar form
     */
    closeForm() {
      this.setState({ key: 'isObjectRecordForm', value: false });
      this.setState({ key: 'currentRecord', value: {} });
      this.setState({ key: 'recordAction', value: 'new' });
    },

    /**
     * Is required form fields
     * @param {String} fieldName
     */
    isRequired(fieldName) {
      return this.requiredFields?.includes(fieldName) || false;
    },

    /**
     * Create/Edit record
     */
    async setRecord() {
      console.table({ ...this.form });
      this.isLoading = true;
      const { name, external_id, ...customFields } = this.form;
      const payload = {
        custom_object_record: {
          name,
          external_id,
          custom_object_fields: customFields,
        },
      };
      try {
        let response;
        if (this.recordAction === 'edit') {
          response = await ZDClient.customObject().update(this.selectedObjectType, this.currentRecord.id, payload);
        } else {
          response = await ZDClient.customObject().create(this.selectedObjectType, payload);
        }
        if (response?.errors?.length) {
          ZDClient.notify('error', response.responseJSON.errors);
          return;
        }
        ZDClient.notify('notice', `Record ${this.recordAction === 'edit' ? 'Updated' : 'Created'}`);
        if (this.recordAction === 'new') {
          this.setState({
            key: 'objectCursor',
            value: {
              prev: null,
              next: null,
              has_more: null,
            },
          });
          this.setState({ key: 'paginationLastAction', value: '' });
        }
        this.setState({ key: 'objectUniqueKey', value: this.objectUniqueKey + 1 });
        this.closeForm();
      } catch (error) {
        ZDClient.notify('error', error?.responseJSON?.errors?.[0]?.detail || 'Error Occurred!');
      } finally {
        this.isLoading = false;
      }
    },
  },
};

export default ObjectRecordForm;
