const template = `
<div class="u-ta-right">
  <button 
    class="btn-svg u-cursor-pointer"
    @click="openMenu"
    ref="actionButton">
    <garden-icon 
      icon="zd-overflow-vertical-fill" 
      name="More Actions"
      class="u-fg-grey-600">
    </garden-icon>
  </button>

  <div :class="['action-item__wrapper', classes]" v-if="!isMenuHidden" ref="actionButtonDropdown">
    <ul 
      class="c-menu is-open"
      aria-hidden="false">
      <li 
        v-for="(option, index) in options" 
        :key="index" 
        class="c-menu__item" 
        @click="change(option)">
        <span>{{ option.label }}</span>
      </li>
    </ul>
  </div>
</div>
`;

import GardenIcon from '../Common/GardenIcon.js';

const ActionItem = {
  template,

  props: {
    options: {
      type: Array,
      default: [],
    },
    item: {
      type: [Array, Object],
    },
  },

  components: {
    GardenIcon,
  },

  data() {
    return {
      isMenuHidden: true,
      isMenuTop: false,
    };
  },

  computed: {
    classes() {
      return [{ 'vs-action__menu--top': this.isMenuTop }];
    },
  },

  mounted() {
    window.addEventListener('click', e => {
      if (!this.$el.contains(e.target)) {
        this.isMenuHidden = true;
      }
    });
  },

  methods: {
    openMenu() {
      this.isMenuHidden = !this.isMenuHidden;
      this.$nextTick(() => {
        this.handleScroll();
      });
    },

    change(option) {
      this.isMenuHidden = true;
      this.$emit('change', option, this.item);
    },

    handleScroll() {
      const dropdown = this.$refs['actionButton'];
      const parentWrapper = document.querySelector('.table-responsive');
      if (!parentWrapper) return;

      // Check if the dropdown has hit the bottom of its parent wrapper
      const dropdownRect = dropdown.getBoundingClientRect();
      const parentRect = parentWrapper.getBoundingClientRect();

      if (dropdownRect.bottom > parentRect.bottom - 200) {
        this.isMenuTop = true;
      } else {
        this.isMenuTop = false;
      }

      // Toggle the visibility of the dropdown
      dropdown.classList.toggle('show');
    },
  },
};

export default ActionItem;
