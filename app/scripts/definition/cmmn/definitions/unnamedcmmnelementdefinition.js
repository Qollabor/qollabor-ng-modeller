/**
 * Simple helper class to support specific extensions to CMMN   
 */
class UnnamedCMMNElementDefinition extends CMMNElementDefinition {
    isNamedElement() {
        return false;
    }
}