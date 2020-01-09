/**
 * Simple helper class to support specific extensions to CMMN   
 */
class CafienneExtension extends UnnamedCMMNElementDefinition {
    constructor(element, caseDefinition, parent) {
        super(element, caseDefinition, parent);
    }
}
CafienneExtension.TAG = IMPLEMENTATION_TAG;
