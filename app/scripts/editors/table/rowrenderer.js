class RowRenderer {
    /**
     * Base class for rendering a row in a table control
     * @param {TableRenderer} control 
     * @param {CMMNElementDefinition} element 
     */
    constructor(control, element = undefined) {
        this.control = control;
        this.control.rows.push(this);
        this._element = element;
        this.html = $(
`<tr>
    ${this.control.columns.map(column => "<td />").join('\n')}
</tr>`);
    }

    get case() {
        return this.control.case;
    }

    get html() {
        return this._html;
    }

    /**
     * Setting the html will also add it to the table  
     * @returns {JQuery<HTMLElement>}
     */
    set html(html) {
        this._html = html;
        this.control.htmlContainer.append(html);
        html.on('click', e => { // Highlight selected row
            e.stopPropagation();
            this.control.htmlContainer.children().toArray().forEach(child => {
                const color = child == this.html[0] ? 'royalblue' : '';
                $(child).css('background-color', color);
            });
            this.control.activeNode = this._element;
        });
        // Avoid pressing delete key leads to remove elements selected.
        html.on('keydown', e => {
            e.stopPropagation();
        });

        // Check for a delete button (with that id) and add event handler
        html.find('.btnDelete').on('click', e => this.delete(e));
    }

    /**
     * Change a property of the element into the new value
     * @param {String} propertyName 
     * @param {*} propertyValue 
     */
    change(propertyName, propertyValue) {
        this.control.change(this.element, propertyName, propertyValue);
    }

    /**
     * Deletes this row and the associated definition.
     * @param {*} e 
     */
    delete(e) {
        e.stopPropagation();
        if (this.isEmpty()) return;
        // Ask whether our element is in use by someone else, before it can be deleted.
        if (this.case.items.find(item => item.referencesDefinitionElement(this.element.id))) {
            ide.danger('The element is in use, it cannot be deleted');
        } else {
            // delete the role
            Util.removeHTML(this.html);
            this.element.removeDefinition();
            this.case.editor.completeUserAction();
        }
    }

    /**
     * @returns {CMMNElementDefinition}
     */
    createElement() {
        throw new Error('The row renderer ' + this.constructor.name + ' must implement this method');
    }

    /**
     * Gives an indication whether this is a newly added renderer without any data associated.
     * @returns {Boolean}
     */
    isEmpty() {
        return this._element == undefined;
    }

    /**
     * @returns {CMMNElementDefinition}
     */
    get element() {
        if (!this._element) {
            this._element = this.createElement();
            this.control.data.push(this._element);
            this.control.renderElement(); // Add a new empty role
        }
        return this._element;
    }

    set element(element) {
        this._element = element;
    }

    /**
     * Refreshes the visualizers relating to the definition element
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {}
}