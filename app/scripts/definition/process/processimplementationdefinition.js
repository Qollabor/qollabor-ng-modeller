class ProcessImplementationDefinition extends XMLElementDefinition {
    /**
    * @param {Element} importNode 
    * @param {CaseDefinition} caseDefinition
    * @param {CMMNElementDefinition} parent optional
    */
    constructor(importNode, caseDefinition, parent = undefined) {
        super(importNode, caseDefinition, parent);
        this.subProcessClassName = this.parseAttribute('class');
        this._xml = XML.prettyPrint(this.importNode);
    }

    get xml() {
        return this._xml;
    }

    set xml(xml) {
        this._xml = xml;
    }

    /**
     * 
     * @param {Element} parent 
     */
    createExportNode(parent) {
        this.exportNode = XML.loadXMLString('<extensionElements>'+this._xml+'</extensionElements>').documentElement;
        parent.appendChild(this.exportNode);
    }
}