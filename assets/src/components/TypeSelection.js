const template = `
<div class="white-box">
  
<!--Object Type Selector-->
  <div class="row align-items-end">
    <div class="col-3" :style="{order: order.object}">
      <vs-select
        label="Select Object"
        :options="filteredObjects"
        v-model="objectType"
        @change="setObjectType"
        is-compact
        is-search>
      </vs-select>
    </div>
    <template v-if="isShowRelationships">
      <div class="col-3" :style="{order: order.relationship}">
        <vs-select
          label="Select Relationhip"
          :options="filteredRelations"
          v-model="relationType"
          @change="setRelationType"
          is-compact
          is-search>
        </vs-select>
      </div>
      <div class="col u-ta-right" style="order: 3">
        <vs-button variant="light" size="small" @click="changeOrder" fill data-name="ZD: Reorder">
          <garden-icon
            icon="zd-arrow-up-down"
            name="Re-order Objects and Relationships"
            class="u-fg-grey-600">
          </garden-icon>
        </vs-button>
      </div>
    </template>
  </div>
</div>
`;

import GardenIcon from './Common/GardenIcon.js';
import ZDClient from '../services/ZDClient.js';

const TypeSelection = {
  template,

  components: {
    GardenIcon,
  },

  data() {
    return {
      objectType: '',
      relationType: '',
      isShowRelationships: ZDClient.app.settings.showRelationships || false,
    };
  },

  computed: {
    ...Vuex.mapGetters([
      'searchText',
      'objectTypes',
      'selectedObjectType',
      'relationTypes',
      'selectedRelationType',
      'order',
    ]),

    /**
     * Create Array from objectTypes with label/value
     * @returns {Array}
     */
    filteredObjects() {
      return this.objectTypes.map(item => {
        return {
          label: item.title,
          value: item.key,
        };
      });
    },

    /**
     * Create Array from relations with label/value
     * @returns {Array}
     */
    filteredRelations() {
      return this.relationTypes.map(item => {
        return {
          label: item.key,
          value: item.key,
        };
      });
    },
  },

  created() {
    this.init();
  },

  methods: {
    ...Vuex.mapActions([
      'setState',
      'getObjectTypes',
      'searchCO',
      'getObjectSchema',
      'getObjectRecords',
      'getRelationshipTypes',
      'getRelationshipRecords',
    ]),

    init() {
      this.objectType = this.selectedObjectType;
      this.relationType = this.selectedRelationType;
      this.getObjectSchema(this.selectedObjectType);
      // this.getObjectRecords();
      // this.getRelationshipRecords();
    },

    /**
     * Set Selected object type and reset search and cursor
     * @param {String} value
     */
    setObjectType(value) {
      this.search = '';
      this.setState({ key: 'searchText', value: '' });
      this.setState({ key: 'paginationLastAction', value: '' });

      this.setState({ key: 'selectedObjectType', value });
      this.setState({ key: 'selectedColumns', value: [] });
      this.getObjectSchema(this.selectedObjectType);
      this.getObjectRecords();
    },

    /**
     * Set Relation type and reset search and cursor
     * @param {String} value
     */
    setRelationType(value) {
      this.setState({ key: 'relationSearchText', value: '' });
      this.setState({
        key: 'relationCursor',
        value: {
          previous: null,
          next: null,
          current: null,
        },
      });
      this.setState({ key: 'selectedRelationType', value });
      this.getRelationshipRecords();
    },

    /**
     * Change/Toggle objects n relationship order
     */
    changeOrder() {
      const order = {
        object: this.order.object === 1 ? 2 : 1,
        relationship: this.order.relationship === 1 ? 2 : 1,
      };
      this.setState({ key: 'order', value: order });
    },
  },
};

export default TypeSelection;
