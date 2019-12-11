/**
 * Simple helper class to support specific extensions to CMMN   
 */
class CafienneExtension extends UnnamedCMMNElementDefinition {
    static TAG = IMPLEMENTATION_TAG;

    constructor(element, caseDefinition, parent) {
        super(element, caseDefinition, parent);
    }
}