REFERENCE CODE FOR CODING A TAG FEATURE

- JSON file with array of tags

- component for tag.js
- catch all component for rendering all tags
- filter component to filter tags


FILTER LOGIC
    selectFilter(type) {
        this.active = type; // type is what datatype you want to filter by
        this.dispatchEvent(
        new CustomEvent("filter-change", {
            detail: type,
            bubbles: true,
            composed: true
        })
        );
    }

render() {
        return html`
            <div class="properties-filter">
                ${["all", "dairy", "meat", "grains", "produce"].map(
                    type => html`
                    <button
                        class=${this.active === type ? "is_active" : ""}
                        @click=${() => this.selectFilter(type)}>
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                `)}
            </div>
        `
    }

CATCH-ALL COMPONENT
 static properties = {
    items: { type: Array },
    filterType: { type: String } // sets default filter datatype as string
  };

  constructor() {
    super();
    this.items = [];
    this.filterType = 'all' // sets default filter as "all"
  }

filterByType(items) { // items would be replaced by tags
    if (this.filterType === "all") return items;
    return items.filter(
      item => item.type.toLowerCase() === this.filterType
    );
  }

TAG COMPONENT
static get properties() {
        return {
            item: { type: Object } // item would be tag in this case
        };
    }


PAGE // might be different syntax bc this sample code is javascript not typescript

let selectedFilter = "all"; // write this before return statement

const onFilterChange = (e) => {
    selectedFilter = e.detail;
    document.querySelector("app-pantry").filterType = selectedFilter;
  };

  return html`

  <!--Main Content-->
    <div class="section properties" style="margin-bottom:48px; margin-top:48px;">
      <div class="container">
        <!-- <add-item-button></add-item-button> -->

      <!--Search / filter-->
        <pantry-filter
          @filter-change=${onFilterChange}
        ></pantry-filter>

      <!--Groups-->
          <app-pantry .filterType=${selectedFilter}></app-pantry>

        <div class="section"></div>
      </div>
    </div>
  `;