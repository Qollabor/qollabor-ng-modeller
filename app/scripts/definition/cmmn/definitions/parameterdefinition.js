
class ParameterDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.bindingRef = this.parseAttribute('bindingRef');
        this.bindingRefinement = this.parseElement('bindingRefinement', ExpressionDefinition);
        this.extensionImplementation = this.parseExtension(CafienneExtension);
        this.required = this.extensionImplementation ? this.extensionImplementation.parseBooleanAttribute('required', false) : false;
    }

    /**
     * @returns {CaseFileItemDef}
     */
    get binding() {
        return this.caseDefinition.getElement(this.bindingRef, CaseFileItemDef);
    }

    get bindingName() {
        return this.bindingRef ? this.binding.name : '';
    }

    get bindingRefinementExpression() {
        return this.bindingRefinement ? this.bindingRefinement.body : '';
    }

    set bindingRefinementExpression(expression) {
        if (expression) {
            this.getBindingRefinement().body = expression;
        } else {
            if (this.bindingRefinement) {
                this.bindingRefinement.removeDefinition();
            }
        }
    }

    /**
     * Gets or creates the bindingRefinement object.
     */
    getBindingRefinement() {
        if (!this.bindingRefinement) {
            this.bindingRefinement = super.createDefinition(ExpressionDefinition);
        }
        return this.bindingRefinement;
    }

    /** @returns {Boolean} */
    get transient() {
        // Parameter is transient if it has no bindingRef and no transformation, and also is not being used in a non-transient parameter mapping
        const task = this.parent;
        if (task instanceof TaskDefinition) {
            if (task.mappings.find(mapping => (mapping.sourceRef == this.id || mapping.targetRef == this.id) && !mapping.transient)) {
                // console.log("Parameter is used in a non-transient mapping ... hence not transient.")
                return false;
            }
        }
        return !this.bindingRefinement && !this.bindingRef;
    }

    createExportNode(parentNode, tagName) {
        if (this.transient) {
            // console.log("Parameter "+this.name+" in "+this.parent.name+" is transient");
            return;
        }
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, 'bindingRef', 'bindingRefinement');
        if (this.required) { // Required is a customization to the spec, put in an extension element
            this.exportExtensionElement().setAttribute('required', 'true');
        }
    }
}

class ImplementationParameterDefinition extends XMLElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this.id = this.parseAttribute('id', this.name);
        this.isNew = false;
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'id', 'name');
    }
}
