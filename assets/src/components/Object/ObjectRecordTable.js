const template = `
<div>  
  <!--Delete Record Modal-->
  <vs-modal
    ref="deleteModal"
    size="s"
    dismiss-on="close-button esc"
    remove-header
    remove-close-button
    align-top>
    <div class="u-ta-center modal-content">
      <img src="./images/IconDelete.svg" alt="Trash" class="modal-img">
      <h1>Are you sure you want to delete?</h1>
      <p class="u-mb">You can't undo this action.</p>
      <vs-button class="u-mr-sm" size="small" @click="closeModal('deleteModal')">Cancel</vs-button>
      <vs-button
        fill
        size="small"
        @click="confirmDelete(currentRecord)"
        :disabled="modalButtonDisabled">
        Confirm
      </vs-button>
    </div>
  </vs-modal>
  
  <!--Clone Record Modal-->
  <vs-modal
    ref="cloneModal"
    size="s"
    dismiss-on="close-button esc"
    remove-header
    remove-close-button
    align-top>
    <div class="u-ta-center modal-content">
      <img src="./images/IconCopy.svg" alt="Clone" class="modal-img">
      <h1 class="u-mb">Are you sure you want to clone?</h1>
      <vs-button class="u-mr-sm" size="small" @click="closeModal('cloneModal')">Cancel</vs-button>
      <vs-button 
        fill 
        size="small" 
        @click="confirmClone(currentRecord)" 
        :disabled="modalButtonDisabled">
        Confirm
      </vs-button>
    </div>
  </vs-modal>

  <div :class="[{'table-responsive': filteredColumns.length > 15}]">
    <table class="c-table u-mb-sm">
      <thead>
        <tr class="c-table__row c-table__row--header">
          <td class="c-table__row__cell">Created</td>
          <td class="c-table__row__cell">Name</td>
          <td class="c-table__row__cell">External ID</td>
          <td
            class="c-table__row__cell"
            v-for="(column, index) in filteredColumns"
            :key="column.id"
            :data-index="column.id">
            {{ column.title }}
          </td>
          <td class="c-table__row__cell u-ta-right">
            <dropdown right offset="5, -10" class="table-column-selector">
              <template v-slot:dropdown-trigger>
                <garden-icon
                  icon="zd-cog"
                  name="settings"
                  class="u-fg-grey-600">
                </garden-icon>
              </template>
              <template v-slot:dropdown-content>
                <vs-multiselect
                  label="Select Columns"
                  :preselected="selectedColumns"
                  :options="filteredColumnOptions"
                  @change="setColumns"
                  is-compact
                  is-search>
                </vs-multiselect>
                <vs-button @click="resetColumns" size="small" class="u-mt-sm">Reset</vs-button>
              </template>
            </dropdown>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-if="objectTableState==='Loading'">
          <td :colspan="filteredColumns.length+4" class="u-ta-center">
            <vs-loader class="u-p" center></vs-loader>
          </td>
        </tr>

        <tr v-if="objectTableState==='NoData'">
          <td :colspan="filteredColumns.length+4" class="u-ta-center u-p">
            <div>No Records Found</div>
          </td>
        </tr>

        <tr v-if="objectTableState==='ApiError'">
          <td :colspan="filteredColumns.length+4" class="u-ta-center u-p">
            API Error Occured
          </td>
        </tr>

        <template v-if="objectTableState==='DataFound'">
          <tr
            :class="[
              'c-table__row',
              {'is-active': currentRecord.id === record.id},
              {'is-disabled': record.attributes?.is_disabled}
            ]"
            v-for="record in objectRecords" 
            :key="record.id">
            <td class="c-table__row__cell">{{ record.created_at | formatDate }}</td>
            <td class="c-table__row__cell">{{ record.name || $emptyState }}</td>
            <td class="c-table__row__cell">{{ record.external_id || $emptyState }}</td>
            <template v-for="(field, index) in filteredColumns">
              <td class="c-table__row__cell" :key="index+'_record'">{{ record.custom_object_fields[field.key] || $emptyState }}</td>
            </template>
            <td class="c-table__row__cell action-cell">
              <action-item
                class="btn-svg-table"
                :options="actionItemOptions"
                :item="record"
                @change="handleActionItemChange">
              ></action-item>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <!--Pagination-->
  <template v-if="objectTableState === 'DataFound'">
    <div class="u-ta-center" v-if="(paginationLastAction === '' && objectCursor.has_more) || paginationLastAction !== ''">
      <vs-button
        size="small"
        class="u-mv u-mr-sm width-100"
        :disabled="paginationLastAction === ''  || (paginationLastAction === 'prev' && !objectCursor.has_more)" 
        @click="changePage('prev')">
        {{ $t('button.previous') }}
      </vs-button>
      <vs-button
        size="small"
        class="u-mv width-100"
        :disabled="(paginationLastAction === '' || paginationLastAction === 'next') && !objectCursor.has_more"
        @click="changePage('next')">
        {{ $t('button.next') }}
      </vs-button>
    </div>
  </template>
</div>
`;

import ActionItem from '../Common/ActionItem.js';
import Dropdown from '../Common/Dropdown.js';
import GardenIcon from '../Common/GardenIcon.js';
import ZDClient from '../../services/ZDClient.js';

const ObjectRecordTable = {
  template,

  components: {
    ActionItem,
    Dropdown,
    GardenIcon,
  },

  data() {
    return {
      modalButtonDisabled: false,
      actionItemOptions: [
        {
          label: 'Edit',
          value: 'edit',
        },
        {
          label: 'Copy ID',
          value: 'copyId',
        },
        {
          label: 'Clone',
          value: 'clone',
        },
        {
          label: 'Delete',
          value: 'delete',
        },
      ],
    };
  },

  computed: {
    ...Vuex.mapGetters([
      'objectTableState',
      'schema',
      'objectRecords',
      'objectCursor',
      'paginationLastAction',
      'currentRecord',
      'recordAction',
      'searchText',
      'selectedObjectType',
      'selectedColumns',
    ]),

    filteredColumns() {
      if (this.selectedColumns.length > 0) {
        return this.schema.filter(obj => this.selectedColumns.includes(obj.key));
      }
      return this.schema;
    },

    filteredColumnOptions() {
      return this.schema.map(item => {
        return item.key;
      });
    },
  },

  mounted() {
    this.initTable();
    this.initSelectedColumns();
  },

  filters: {
    /**
     * Converts string with '_' or '-' into space.
     * @param {String} value
     * @returns {String}
     */
    filterName(value) {
      return value.replace(/[\-_]/g, ' ');
    },

    /**
     * Formats date
     * @param {Date} date
     */
    formatDate(date) {
      if (!date) return date;
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    },
  },

  watch: {
    schema: {
      immediate: false,
      deep: true,
      handler() {
        this.initSelectedColumns();
      },
    },
  },

  methods: {
    ...Vuex.mapActions(['setState', 'getObjectRecords', 'searchCO']),

    /**
     * Initialze Table
     */
    initTable() {
      if (!this.objectCursor.previous) {
        this.setState({
          key: 'cursor',
          value: {
            prev: null,
            next: null,
            has_more: null,
          },
        });
        this.setState({ key: 'paginationLastAction', value: '' });
      }
      if (!this.searchText) {
        this.getObjectRecords();
      } else {
        this.searchCO();
      }
    },

    /**
     * Set columns for table
     * @param {Array} columns
     * @returns
     */
    setColumns(columns) {
      if (columns.length === 0) return;
      if (this.filteredColumns === 1) {
        return;
      }
      this.setState({ key: 'selectedColumns', value: columns });
    },

    /**
     * Init columns selection
     */
    initSelectedColumns() {
      if (this.selectedColumns.length > 0) return;
      if (this.schema.length === 0) return;
      const columns = this.schema.map(item => {
        return item.key;
      });
      this.setState({ key: 'selectedColumns', value: columns });
    },

    /**
     * Reset columns selections
     */
    resetColumns() {
      const columns = this.schema.map(item => {
        return item.key;
      });
      this.setState({ key: 'selectedColumns', value: columns });
    },

    /**
     * Pagination: Change page
     * @param {String} value (previous/next key)
     */
    changePage(value) {
      this.setState({ key: 'paginationLastAction', value });
      if (!this.searchText) {
        this.getObjectRecords(this.objectCursor[value]);
        return;
      }
      this.searchCO(this.objectCursor[value]);
    },

    /**
     * Perform Action on action item selection
     * @param {Object} actionItem
     * @param {Object} item
     */
    handleActionItemChange(actionItem = {}, item = {}) {
      console.log('---Record Action---\n', actionItem.value);
      console.log('---Current Record---\n', item, '\n\n\n');
      this.setState({ key: 'isObjectRecordForm', value: false });
      this.setState({ key: 'recordAction', value: actionItem.value });
      this.setState({ key: 'currentRecord', value: { ...item } });
      if (this.recordAction === 'edit') {
        this.setState({ key: 'isObjectRecordForm', value: true });
      }
      if (this.recordAction === 'delete') {
        this.openModal('deleteModal');
      }
      if (this.recordAction === 'clone') {
        this.openModal('cloneModal');
      }
      if (this.recordAction === 'copyId') {
        this.copy(item.id);
      }
    },

    /**
     * Copy to clipboard
     * @param {String} data
     */
    async copy(data) {
      await navigator.clipboard.writeText(data);
      ZDClient.notify('notice', `Copied ID: ${data}`);
    },

    /**
     * Open modal
     * @param {String} ref
     */
    openModal(ref) {
      this.$refs[ref].open();
    },

    /**
     * Close modal & perform action
     * @param {String} ref
     */
    closeModal(ref) {
      this.$refs[ref].close();
      this.modalButtonDisabled = false;
      this.setState({ key: 'recordAction', value: 'new' });
      this.setState({ key: 'currentRecord', value: {} });
    },

    /**
     * Delete Record
     * @param {Object} currentItem
     */
    async confirmDelete(currentItem) {
      this.modalButtonDisabled = true;
      try {
        await ZDClient.customObject().delete(this.selectedObjectType, currentItem.id);
        ZDClient.notify('notice', 'Deleted Record');
      } catch (error) {
        ZDClient.notify('error', error?.responseJSON?.errors?.[0]?.detail || 'Error Occurred!');
      } finally {
        this.closeModal('deleteModal');
        this.setState({
          key: 'objectCursor',
          value: {
            prev: null,
            next: null,
            has_more: null,
          },
        });
        this.setState({ key: 'paginationLastAction', value: '' });
        this.initTable();
      }
    },

    /**
     * Clone Record
     * @param {Object} currentItem
     */
    async confirmClone(currentItem) {
      this.modalButtonDisabled = true;
      const payload = {
        custom_object_record: {
          name: `${currentItem.name} Copy`,
          custom_object_fields: { ...currentItem.custom_object_fields },
        },
      };
      try {
        const response = await ZDClient.customObject().create(this.selectedObjectType, payload);
        if (response?.errors?.length) {
          ZDClient.notify('error', response.responseJSON.errors?.[0].detail);
          return;
        }
        ZDClient.notify('notice', 'Record Cloned');
      } catch (error) {
        ZDClient.notify('error', error?.responseJSON?.errors?.[0]?.detail || 'Error Occurred!');
      } finally {
        this.closeModal('cloneModal');
        this.setState({
          key: 'objectCursor',
          value: {
            prev: null,
            next: null,
            has_more: null,
          },
        });
        this.setState({ key: 'paginationLastAction', value: '' });
        this.initTable();
      }
    },
  },
};

export default ObjectRecordTable;
