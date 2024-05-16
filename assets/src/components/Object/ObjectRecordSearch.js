const template = `
<div>
  <div class="row u-mv">
    <!--Search-->
    <form class="col-3" @submit.prevent="searchRecord">
      <div class="search__form-element">
        <input type="text" placeholder="Search..." v-model="search" class="c-txt__input c-txt__input--sm">
        <vs-button fill size="small" type="submit" data-name="ZD: Search">
          <garden-icon icon="zd-search" name="search" class="search-btn"></garden-icon>
        </vs-button>
      </div>
      <a @click.prevent="resetSearch" class="clear-link" v-if="searchText" data-name="ZD: Clear Search">Clear</a>
    </form>

    
    <div class="col u-ta-right position-button-top">
      <!--Bulk Upload Records-->
      <vs-button 
        class="u-mr-sm u-decoration-none"
        :href="bulkImport()"
        target="_blank"
        size="small"
        data-name="ZD: Bulk Upload Records">
        <garden-icon icon="zd-upload" class="download-icon"></garden-icon>
        Upload Records
      </vs-button>
      <object-download></object-download>
      <object-delete></object-delete>
      <!--Create Record-->
      <vs-button fill size="small" @click="openForm" data-name="ZD: Create Record">
        <garden-icon icon="zd-plus" class="create-icon"></garden-icon>
        Create Record
      </vs-button>
    </div>
  </div>
</div>
`;

import ObjectDownload from './ObjectDownload.js';
import ObjectDelete from './ObjectDelete.js';
import GardenIcon from '../Common/GardenIcon.js';
import Dropdown from '../Common/Dropdown.js';
import ZDClient from '../../services/ZDClient.js';

const ObjectRecordSearch = {
  template,

  components: {
    ObjectDownload,
    ObjectDelete,
    GardenIcon,
    Dropdown,
  },

  data() {
    return {
      search: this.searchText || '',
    };
  },

  computed: {
    ...Vuex.mapGetters(['searchText']),
  },

  methods: {
    ...Vuex.mapActions(['setState', 'searchCO', 'getObjectRecords']),

    /**
     * Search CO records
     */
    searchRecord() {
      if (!this.search) return;
      this.setState({ key: 'searchText', value: this.search });
      this.setState({
        key: 'objectCursor',
        value: {
          prev: null,
          next: null,
          has_more: null,
        },
      });
      this.setState({ key: 'paginationLastAction', value: '' });
      this.searchCO();
    },

    /**
     * Reset search form
     */
    async resetSearch() {
      this.search = '';
      this.setState({ key: 'searchText', value: this.search });
      this.setState({
        key: 'objectCursor',
        value: {
          prev: null,
          next: null,
          has_more: null,
        },
      });
      this.getObjectRecords();
    },

    /**
     * Open sidebar form
     */
    openForm() {
      this.setState({ key: 'isObjectRecordForm', value: true });
      this.setState({ key: 'recordAction', value: 'new' });
      this.setState({ key: 'currentRecord', value: {} });
    },

    /**
     * Bulk upload redirect link
     * @returns {String}
     */
    bulkImport() {
      const bulkImportURL = `https://${ZDClient.app.domain}.zendesk.com/admin/objects-rules/tools/data-importer`;
      return bulkImportURL;
    },
  },
};

export default ObjectRecordSearch;
