
class HumanTaskDefinition extends TaskDefinition {
    static get prefix() {
        return 'ht';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.performerRef = this.parseAttribute('performerRef');
        this.extensionElement = XML.getChildByTagName(this.importNode, 'extensionElements');
        this.extensionImplementation = XML.getChildByTagName(this.extensionElement, IMPLEMENTATION_TAG);
        if (this.extensionImplementation) {
            this.humanTaskRef = this.extensionImplementation.getAttribute('humanTaskRef');
            this.validatorRef = this.extensionImplementation.getAttribute('validatorRef');
            XML.getChildrenByTagName(this.extensionImplementation, 'parameterMapping').forEach(childNode => this.instantiateChild(childNode, ParameterMappingDefinition, this.mappings));
            this.assignment = this.parseExtensionElement(AssignmentDefinition);
            this.dueDate = this.parseExtensionElement(DueDateDefinition);
        }
    }

    /**
     * @returns {CaseRoleDefinition}
     */
    get performer() {
        return this.caseDefinition.getElement(this.performerRef);
    }
    
    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'humanTask', 'planningTable', 'performerRef');
        if (this.mappings.length > 0 || this.humanTaskRef || this.assignment || this.validatorRef) {
            const extensionImplementationNode = this.exportExtensionElement();
            if (this.humanTaskRef) {
                extensionImplementationNode.setAttribute('humanTaskRef', this.humanTaskRef);
            }
            if (this.validatorRef) {
                extensionImplementationNode.setAttribute('validatorRef', this.validatorRef);
            }
            this.mappings.forEach(mapping => mapping.createExportNode(extensionImplementationNode));
            if (this.assignment) {
                this.assignment.createExportNode(extensionImplementationNode);
            }
            if (this.dueDate) {
                this.dueDate.createExportNode(extensionImplementationNode);
            }
        }
    }

    /**
     * @returns {String} The name of the role that is assigned as the performer of the task
     */
    get performerName() {
        const performer = this.caseDefinition.getElement(this.performerRef);
        return performer ? performer.name : '';
    }

    /**
     * @returns {String}
     */
    get implementationRef() {
        return this.humanTaskRef;
    }

    set implementationRef(ref) {
        this.humanTaskRef = ref;
    }

    /**
     * @returns {DueDateDefinition}
     */
    get dueDate() {
        return this._dueDate;
    }

    set dueDate(duedate) {
        this._dueDate = duedate;
    }

    /**
     * @returns {AssignmentDefinition}
     */
    get assignment() {
        return this._assignment;
    }

    set assignment(assignment) {
        this._assignment = assignment;
    }

    /**
     * @returns {String}
     */
    get validatorRef() {
        return this._validatorRef;
    }

    set validatorRef(ref) {
        this._validatorRef = ref;
    }
}