class HumanTaskModelElementDefinition extends XMLElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {HumanTaskModelDefinition} modelDefinition
     * @param {HumanTaskModelElementDefinition} parent optional
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        super(importNode, modelDefinition, parent);
        this.id = this.parseAttribute('id');
        this.name = this.parseAttribute('name');
        this.description = this.parseAttribute('description');
    }

}