class HumanTaskModelElementDefinition extends ReferableElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {HumanTaskModelDefinition} modelDefinition
     * @param {HumanTaskModelElementDefinition} parent optional
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        super(importNode, modelDefinition, parent);
    }
}