class PropertyDefinition extends XMLElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this.type = this.parseAttribute('type', '');
        this.extensionImplementation = this.parseExtension(CafienneExtension);
        this.isBusinessIdentifier = this.extensionImplementation ? this.extensionImplementation.parseBooleanAttribute('isBusinessIdentifier', false) : false;
    }

    createExportNode(parent) {
        super.createExportNode(parent, 'property', 'name', 'type');
        if (this.isBusinessIdentifier) { // BusinessIdentifier is a customization to the spec, put in an extension element
            this.exportExtensionElement().setAttribute('isBusinessIdentifier', 'true');
        }
    }

}