const template = `
<span v-if="objectTableState==='DataFound'">
  <!--Delete All Records-->
  <vs-button size="small" variant="danger" @click="confirmDelete" class="u-mr-sm" data-name="ZD: Delete All Records">
    <garden-icon icon="zd-close" class="delete-icon">
    </garden-icon>
    Delete All Records
  </vs-button>

  <!--Delete record modal-->
  <vs-modal
    ref="deleteModal"
    size="s"
    dismiss-on="close-button esc"
    remove-header
    remove-close-button
    align-top>
    <div class="u-ta-center modal-content">
      <img src="./images/IconDelete.svg" alt="Trash" class="modal-img">
      <h1>Are you sure you want to delete all records?</h1>
      <p class="u-mb">You can't undo this action.</p>
      <vs-button class="u-mr-sm" size="small" @click="closeModal('deleteModal')">Cancel</vs-button>
      <vs-button
        fill
        size="small"
        @click="deleteAllRecords">
        Confirm
      </vs-button>
    </div>
  </vs-modal>

  <!--Delete records progress modal-->
  <vs-modal
    ref="deletingModal"
    size="s"
    dismiss-on="close-button esc"
    remove-header
    remove-close-button
    align-top>
    <div class="u-ta-center modal-content">
      <img src="./images/IconDelete.svg" alt="Trash" class="modal-img">
      <h1 class="u-mb">Please wait while we delete all records!</h1>
      <div v-if="totalRecordsToProcess > 100">
        <div>{{completion}}% complete</div>
        <progress class="progressbar" max="100" :value="completion">{{completion}}</progress>
      </div>
    </div>
  </vs-modal>
</span>
`;

import GardenIcon from '../Common/GardenIcon.js';
import ZDClient from '../../services/ZDClient.js';

const ObjectDelete = {
  template,

  components: {
    GardenIcon,
  },

  data() {
    return {
      records: [],
      completion: 0,
      totalProcessed: 0,
      totalRecordsToProcess: 0,
    };
  },

  computed: {
    ...Vuex.mapGetters(['selectedObjectType', 'schema', 'objectTableState', 'objectUniqueKey']),
  },

  methods: {
    ...Vuex.mapActions(['setState']),

    /**
     * Open delete confirm dialog
     */
    confirmDelete() {
      this.completion = 0;
      this.totalProcessed = 0;
      this.totalRecordsToProcess = 0;
      this.$refs['deleteModal'].open();
    },

    /**
     * Close modal & perform action
     * @param {String} ref
     */
    closeModal(ref) {
      this.$refs[ref].close();
    },

    async deleteAllRecords() {
      this.$refs['deleteModal'].close();
      this.$refs['deletingModal'].open();
      this.records = await this.paginatedFetch(this.selectedObjectType);
      console.log(this.records);
      await this.createDeleteJob();
    },

    /**
     * Recursive do API fetch based on 'next_page' cursor key
     * @param {String} selectedObjectType
     * @param {String} cursor
     * @param {Array} previousResponse
     * @returns {Array}
     */
    async paginatedFetch(selectedObjectType, cursor = null, previousResponse = []) {
      try {
        const response = await ZDClient.customObject().read(this.selectedObjectType, cursor, 100);
        const data = [...previousResponse, ...response.custom_object_records];
        if (!!response.meta.has_more) {
          return await this.paginatedFetch(selectedObjectType, response.links.next, data);
        }
        return data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Call sunshine batch API to delete records in bulk
     * @param {Int} batchIndex
     * @param {Array} batches
     */
    async createDeleteJob(batchIndex, batches) {
      let currentBatchIndex = batchIndex || 0;
      let batchOfBatches = batches || [];
      let records = this.records;
      this.totalRecordsToProcess = this.records.length;

      if (currentBatchIndex < 1) {
        let newBatch = [];
        const batchSize = Math.min(100, records.length);

        for (let i = 0; i < records.length; i++) {
          if (newBatch.length < batchSize) {
            if (records[i]) {
              newBatch.push(records[i].id);
            }
          } else {
            batchOfBatches.push([...newBatch]);
            newBatch = [];
            if (records[i]) {
              newBatch.push(records[i].id);
            }
          }
        }

        if (newBatch.length > 0) {
          batchOfBatches.push([...newBatch]);
        }

        console.log('Batch Of Batches:', batchOfBatches);
      }

      if (batchOfBatches.length > 0) {
        const createJob = await ZDClient.customObject().createJob(
          this.selectedObjectType,
          'delete',
          batchOfBatches[currentBatchIndex],
        );
        console.log('Create Job:', createJob);

        const jobCheckInterval = setInterval(async () => {
          console.log('Checking job status...');
          const getJobStatus = await ZDClient.customObject().getJobStatus(createJob.job_status.id);
          console.log('Get Job Status:', getJobStatus);

          if (getJobStatus.job_status.status === 'completed' || getJobStatus.job_status.status === 'failed') {
            clearInterval(jobCheckInterval);
            this.totalProcessed += getJobStatus.job_status.progress;
            console.log('Total Processed:', this.totalProcessed);
            this.updateProgressBar();

            if (batchOfBatches.length > currentBatchIndex + 1) {
              this.createDeleteJob(currentBatchIndex + 1, batchOfBatches);
            } else {
              this.resetTable();
            }
          }
        }, 2000);
      } else {
        this.resetTable();
      }
    },

    /**
     * Reset table after deletion
     */
    resetTable() {
      this.$refs['deletingModal'].close();
      this.setState({ key: 'paginationLastAction', value: '' });
      this.setState({ key: 'objectUniqueKey', value: this.objectUniqueKey + 1 });
    },

    /**
     * Update deletion progress bar
     */
    updateProgressBar() {
      this.completion = (this.totalProcessed / this.totalRecordsToProcess) * 100;
      this.completion = Math.floor(this.completion);
    },
  },
};

export default ObjectDelete;
