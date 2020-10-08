class CaseParametersEditor extends StandardForm {
    /**
     * 
     * @param {CaseModelEditor} editor 
     */
    constructor(editor) {
        super(editor, 'Edit case parameters', 'caseparameters');
    }

    renderHead() {
        super.renderHead();
        this.htmlContainer.html(
`<div class="parameterscontainer">
    <div class="input parameters">
        <h4>Input Parameters</h4>
        <div class="parameterbox input-parameters"></div>
    </div>
    <div class="output parameters">
        <h4>Output Parameters</h4>
        <div class="parameterbox output-parameters"></div>
    </div>
</div>`);
        const inputMappingsContainer = this.htmlContainer.find('.input-parameters');
        this.inputParameters = new InputParametersControl(this, inputMappingsContainer);
        const outputMappingsContainer = this.htmlContainer.find('.output-parameters');
        this.outputParameters = new OutputParametersControl(this, outputMappingsContainer);
        this.splitter = new BottomSplitter(this.htmlContainer.find('.parameterscontainer'), 200, 100);
    }

    renderData() {
        this.inputParameters.renderTable();
        this.outputParameters.renderTable();
    }

    open() {
        this.visible = true;
    }

    /**
     * Closes the editor form (hides it)
     */
    close() {
        this.visible = false;
    }

    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }

    /** 
     * validates this
     */
    validate() {
        if (this.inputParameters) {
            // TODO: validation belongs in the definition side of the house.
            this.inputParameters.validate();
            this.outputParameters.validate();    
        }
    }

    __mark(bMark) {
        if (this.case.casePlanModel) {
            this.case.casePlanModel.__mark(bMark);            
        }
    }
}

class ParametersControl extends TableRenderer {
    /**
     * Creates a table to render parameters
     * @param {CaseParametersEditor} editor 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(editor, htmlParent) {
        super(editor.case, htmlParent);
        this.editor = editor;
    }

    /** 
     * validates this
     */
    validate() {
        const description = this.constructor.name.split('ParametersControl')[0] + ' Case Parameter';
        // Throw a problem for each parameter that does not have a name
        this.parameters.filter(p => !p.name).forEach(p => this.case.raiseEditorIssue(p, 1, [description, this.case.name, p.bindingRef]));
    }

    /**
     * @returns {Array<ParameterDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get parameters() {
        return this.data;
    }

    refresh() {
        this.editor.refresh();
    }

    /**
     * 
     * @param {ParameterDefinition} parameter 
     */
    addRenderer(parameter = undefined) {
        return new ParameterRow(this, parameter);
    }
}

class InputParametersControl extends ParametersControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    get data() {
        return this.case.caseDefinition.input;
    }

    get columns() {
        return [
            new ColumnRenderer(ParameterDeleter),
            new ColumnRenderer(NameChanger),
            new ColumnRenderer(ExpressionChanger, 'The transformation that is executed while binding parameter to the case file item'),
            new ColumnRenderer(CFIZoom, 'The case file item that binds to the parameter.\nAn empty binding means the parameter will not be used.')
        ];
    }
}

class OutputParametersControl extends ParametersControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    get data() {
        return this.case.caseDefinition.output;
    }

    get columns() {
        return [
            new ColumnRenderer(ParameterDeleter),
            new ColumnRenderer(NameChanger),
            new ColumnRenderer(ExpressionChanger, 'The transformation that is executed while binding the case file item to the parameter'),
            new ColumnRenderer(CFIZoom, 'The case file item that is used to fill the output parameter.\nAn empty binding means the parameter will be filled with the outcome of the expression.')
        ];
    }
}

class ParameterRow extends RowRenderer {
    /**
     * @param {ParametersControl} control
     */
    constructor(control, parameter = undefined) {
        super(control, parameter);
        this.control = control;
        this.parameterName = parameter ? parameter.name : '';
        this.expression = parameter && parameter.bindingRefinement ? parameter.bindingRefinement.body : '';
        this.bindingName = parameter ? parameter.bindingName : '';
    }

    /** @returns {ParameterDefinition} */
    get parameter() {
        // Just to have some typesafe reference
        return this.element;
    }

    /**
     * 
     * @param {CaseFileItemDef} cfi 
     */
    changeBindingRef(cfi) {
        if (! this.parameterName) {
            this.parameter.bindingRef = cfi.id;
            this.parameterName = this.parameter.name = this.parameter.bindingName;
        }
        this.change('bindingRef', cfi.id);
        this.html.find('.cfiDescription').html(this.parameter.bindingName);
        this.html.find('.parameter-name').val(this.parameter.name);
    }

    /**
     * Name of the parameter
     * @param {String} newName 
     */
    changeName(newName) {
        if (!this.parameter.bindingRef) {
            // try to find a matching case file item
            const caseFileItem = this.parameter.caseDefinition.getCaseFile().getDescendants().find(child => child.name === newName);
            if (caseFileItem) {
                this.parameter.bindingRef = caseFileItem.id;
                this.html.find('.cfiDescription').html(this.parameter.bindingName);
            }
        }
        super.change('name', newName);
    }

    /**
     * Refreshes the case file item label if we render it
     * @param {CMMNElementDefinition} cfi 
     */
    refreshReferencingFields(cfi) {
        super.refreshReferencingFields(cfi);
        if (! this.isEmpty() && this.parameter.bindingRef == cfi.id) {
            this.html.find('.cfiDescription').html(cfi.name);
        }
    }

    /**
     * @returns {ParameterDefinition}
     */
    createElement() {
        return this.control.editor.case.caseDefinition.createDefinition(ParameterDefinition);
    }
}
