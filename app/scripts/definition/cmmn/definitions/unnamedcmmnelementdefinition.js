/**
 * Simple helper class to support specific extensions to CMMN   
 */
class UnnamedCMMNElementDefinition extends CMMNElementDefinition {
    createExportNode(parentNode, tagName, ...propertyNames) {
        this.name = ''; // Clear the name
        super.createExportNode(parentNode, tagName, propertyNames);
    }
}