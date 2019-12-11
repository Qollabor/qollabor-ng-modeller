class PropertyDefinition extends XMLElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this.type = this.parseAttribute('type', '');
    }

    createExportNode(parent) {
        super.createExportNode(parent, 'property', 'name', 'type');
    }
}