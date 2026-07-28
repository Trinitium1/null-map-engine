class TableFilter {
    constructor(tableContainerId, headers, data, renderRowCallback) {
        this.containerId = tableContainerId;
        this.headers = headers; // [{id: 'name', label: 'Player', filterable: true}, ...]
        this.data = data; // Raw array of objects
        this.filteredData = [...data];
        this.renderRowCallback = renderRowCallback; // function(row) => html string

        // State for filters: { headerId: { search: '', selected: Set(['val1', 'val2']) } }
        this.filters = {};
        this.activeDropdown = null;

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Build Table Structure
        let html = `
            <div style="overflow-x: auto;">
                <table class="filter-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #2f3542;">
        `;

        let dropdownsHtml = '';
        this.headers.forEach(h => {
            html += `
                <th style="padding: 6px; border: 1px solid rgba(255,255,255,0.1); position: relative;">
                    <div style="display: flex; align-items: center; justify-content: space-between; color: #a4b0be; cursor: ${h.filterable ? 'pointer' : 'default'};" ${h.filterable ? `id="filter-trigger-${this.containerId}-${h.id}"` : ''}>
                        <span>${h.label}</span>
                        ${h.filterable ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>` : ''}
                    </div>
                </th>
            `;
            if (h.filterable) {
                dropdownsHtml += this._buildDropdownHTML(h.id);
                this.filters[h.id] = { search: '', selected: new Set(this._getUniqueValues(h.id)) };
            }
        });

        html += `
                        </tr>
                    </thead>
                    <tbody id="tbody-${this.containerId}">
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        
        let oldDropdowns = document.getElementById(`dropdowns-${this.containerId}`);
        if (oldDropdowns) oldDropdowns.remove();
        
        let dpContainer = document.createElement('div');
        dpContainer.id = `dropdowns-${this.containerId}`;
        dpContainer.innerHTML = dropdownsHtml;
        document.body.appendChild(dpContainer);

        this._bindEvents();
        this.renderBody();
    }

    _getUniqueValues(key) {
        const vals = this.data.map(d => String(d[key] || ''));
        return [...new Set(vals)].sort();
    }

    _buildDropdownHTML(headerId) {
        return `
            <div id="dropdown-${this.containerId}-${headerId}" class="filter-dropdown" style="display: none; position: absolute; background: #2f3542; border: 1px solid #57606f; border-radius: 4px; padding: 8px; z-index: 10000; width: 200px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <input type="text" id="search-${this.containerId}-${headerId}" placeholder="Search..." style="width: 100%; padding: 4px; margin-bottom: 8px; background: #1e1e24; border: 1px solid #57606f; color: #f1f2f6; border-radius: 2px;">
                <div style="display: flex; gap: 5px; margin-bottom: 8px; font-size: 10px;">
                    <button id="selall-${this.containerId}-${headerId}" style="flex:1; background: #70a1ff; color: #fff; border:none; padding:2px; cursor:pointer; border-radius:2px;">Select All</button>
                    <button id="clearall-${this.containerId}-${headerId}" style="flex:1; background: #ff4757; color: #fff; border:none; padding:2px; cursor:pointer; border-radius:2px;">Clear</button>
                </div>
                <div id="list-${this.containerId}-${headerId}" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; font-weight: normal; color: #f1f2f6;">
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
                    <button id="apply-${this.containerId}-${headerId}" style="background: #2ed573; color: #1e1e24; font-weight: bold; border: none; padding: 4px 10px; border-radius: 2px; cursor: pointer;">Apply</button>
                </div>
            </div>
        `;
    }

    _bindEvents() {
        // Global click to close dropdowns
        document.addEventListener('click', (e) => {
            if (this.activeDropdown && !e.target.closest(`#filter-trigger-${this.containerId}-${this.activeDropdown}`) && !e.target.closest(`#dropdown-${this.containerId}-${this.activeDropdown}`)) {
                document.getElementById(`dropdown-${this.containerId}-${this.activeDropdown}`).style.display = 'none';
                this.activeDropdown = null;
            }
        });

        this.headers.filter(h => h.filterable).forEach(h => {
            const trigger = document.getElementById(`filter-trigger-${this.containerId}-${h.id}`);
            const dropdown = document.getElementById(`dropdown-${this.containerId}-${h.id}`);
            const searchInput = document.getElementById(`search-${this.containerId}-${h.id}`);
            const listContainer = document.getElementById(`list-${this.containerId}-${h.id}`);
            const btnSelAll = document.getElementById(`selall-${this.containerId}-${h.id}`);
            const btnClearAll = document.getElementById(`clearall-${this.containerId}-${h.id}`);
            const btnApply = document.getElementById(`apply-${this.containerId}-${h.id}`);

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.activeDropdown && this.activeDropdown !== h.id) {
                    document.getElementById(`dropdown-${this.containerId}-${this.activeDropdown}`).style.display = 'none';
                }
                
                if (dropdown.style.display === 'none') {
                    const rect = trigger.getBoundingClientRect();
                    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                    dropdown.style.left = rect.left + 'px';
                    
                    dropdown.style.display = 'block';
                    this.activeDropdown = h.id;
                    this._renderCheckboxList(h.id);
                    searchInput.focus();
                } else {
                    dropdown.style.display = 'none';
                    this.activeDropdown = null;
                }
            });

            searchInput.addEventListener('input', (e) => {
                this.filters[h.id].search = e.target.value.toLowerCase();
                this._renderCheckboxList(h.id);
            });

            btnSelAll.addEventListener('click', () => {
                const visibleVals = this._getVisibleCheckboxValues(h.id);
                visibleVals.forEach(v => this.filters[h.id].selected.add(v));
                this._renderCheckboxList(h.id);
            });

            btnClearAll.addEventListener('click', () => {
                const visibleVals = this._getVisibleCheckboxValues(h.id);
                visibleVals.forEach(v => this.filters[h.id].selected.delete(v));
                this._renderCheckboxList(h.id);
            });

            btnApply.addEventListener('click', () => {
                dropdown.style.display = 'none';
                this.activeDropdown = null;
                this.applyFilters();
            });
        });
    }

    _getVisibleCheckboxValues(headerId) {
        const search = this.filters[headerId].search;
        return this._getUniqueValues(headerId).filter(v => v.toLowerCase().includes(search));
    }

    _renderCheckboxList(headerId) {
        const listContainer = document.getElementById(`list-${this.containerId}-${headerId}`);
        const visibleVals = this._getVisibleCheckboxValues(headerId);
        
        listContainer.innerHTML = visibleVals.map(val => {
            const isChecked = this.filters[headerId].selected.has(val);
            return `
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" class="chk-${this.containerId}-${headerId}" value="${val}" ${isChecked ? 'checked' : ''}>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${val}">${val === '' ? '(Blank)' : val}</span>
                </label>
            `;
        }).join('');

        // Bind checkbox changes directly to state
        listContainer.querySelectorAll(`input[type="checkbox"]`).forEach(chk => {
            chk.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.filters[headerId].selected.add(e.target.value);
                } else {
                    this.filters[headerId].selected.delete(e.target.value);
                }
            });
        });
    }

    applyFilters() {
        this.filteredData = this.data.filter(row => {
            return this.headers.filter(h => h.filterable).every(h => {
                const val = String(row[h.id] || '');
                return this.filters[h.id].selected.has(val);
            });
        });
        
        // Highlight active filter headers
        this.headers.filter(h => h.filterable).forEach(h => {
            const trigger = document.getElementById(`filter-trigger-${this.containerId}-${h.id}`);
            const totalUnique = this._getUniqueValues(h.id).length;
            if (this.filters[h.id].selected.size < totalUnique) {
                trigger.style.color = '#70a1ff';
            } else {
                trigger.style.color = '#a4b0be';
            }
        });

        this.renderBody();
    }

    renderBody() {
        const tbody = document.getElementById(`tbody-${this.containerId}`);
        if (!tbody) return;

        if (this.filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.headers.length}" style="text-align: center; padding: 10px; color: #a4b0be;">No data found matching filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.filteredData.map(row => this.renderRowCallback(row)).join('');
    }
}
window.TableFilter = TableFilter;
