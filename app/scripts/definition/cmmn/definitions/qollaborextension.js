/**
 * Simple helper class to support specific extensions to CMMN   
 */
class QollaborExtension extends UnnamedCMMNElementDefinition {
    constructor(element, caseDefinition, parent) {
        super(element, caseDefinition, parent);
    }
}
QollaborExtension.TAG = IMPLEMENTATION_TAG;
