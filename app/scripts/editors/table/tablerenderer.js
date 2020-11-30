class TableRenderer {
    /**
     * Defines a generic control for collections of CMMNElementDefinition, to select and edit data in a table
     * @param {Case} cs
     * @param {JQuery<HTMLElement>} htmlParent
     */
    constructor(cs, htmlParent) {
        this.case = cs;
        this.htmlParent = htmlParent;
        /** @type {Array<RowRenderer>} */
        this.rows = []; // Reset array of row renderers
    }

    get html() {
        return this._html;
    }

    /**
     * @param {JQuery<HTMLElement>} html
     */
    set html(html) {
        this._html = html;
        // console.log("Setting the html of the table renderer ...")
        this.htmlParent.append(html);
    }

    /** @returns {Array<ColumnRenderer>} */
    get columns() {
        throw new Error('Columns must be implemented in table editor');
    }

    /**
     * Clears the content of the editor and removes all event handlers (recursively on all child html elements)
     * Note, this is different from "delete()", since delete removes all html, not just the data related content of the editor.
     */
    clear() {
        this.rows = [];
        Util.clearHTML(this.htmlContainer);
    }

    /**
     * Renders the table inside the control again, but only if it has already been rendered.
     */
    refresh() {
        if (this._html) {
            this.renderTable();
        }
    }

    /**
     * Clears the current content of the editor and renders it again
     */
    renderTable() {
        if (! this._html) {
            this.renderHead();            
        }
        this.renderData();
    }
 
    renderHead() {
        //create the html element of the editor form
        this.html = $(`<table>
                        <colgroup>
                            ${this.columns.map(column => column.col).join('\n')}
                        </colgroup>
                        <thead>
                            <tr>
                                ${this.columns.map(column => column.th).join('\n')}
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>`);

        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('tbody');
    }

    /**
     * Removes current data content (and event handlers), 
     * and freshly renders the data again.
     */
    renderData() {
        this.clear();
        this.data.forEach(element => this.renderElement(element));
        const renderer = this.renderElement(); // Add an empty renderer at the bottom, for creating new elements
    }

    renderElement(element) {
        const rowRenderer = this.addRenderer(element);
        if (rowRenderer) { // Also create the columns
            const tdElements = rowRenderer.html.find('td');
            this.columns.forEach((columnRenderer, index) => {
                const td = tdElements[index]; // There MUST be as many TDs as columns. Else let it crash. Also: better we create the td here instead...
                columnRenderer.render($(td), rowRenderer);
            });
        }
    }

    /**
     * 
     * @param {CMMNElementDefinition} element 
     * @returns {RowRenderer}
     */
    addRenderer(element = undefined) {
        throw new Error('Method addRenderer must be implemented in table editor ' + this.constructor.name);
    }

    /**
     * @returns {Array<CMMNElementDefinition>}
     */
    get data() {
        throw new Error('Property data is not implemented for ' + this.constructor.name);
    }

    /** @returns {CMMNElementDefinition} */
    get activeNode() {
        return this._selectedElement;
    }

    /**
     * @param {CMMNElementDefinition} node
     */
    set activeNode(node) {
        this._selectedElement = node;
    }

    delete() {
        // Delete the generic events of the editor (e.g. click add button, ...)
        Util.removeHTML(this.html);
    }

    /**
     * 
     * @param {CMMNElementDefinition} element 
     * @param {String} field 
     * @param {*} value 
     */
    change(element, field, value) {
        console.log("Changing field '" + field + "' in element " + element.constructor.name + " into " + value)
        element[field] = value;
        this.case.editor.completeUserAction();
    }

    /**
     * when the description of a case file item is changed the zoom fields must be updated
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        this.rows.forEach(row => row.refreshReferencingFields(definitionElement));
    }
}
