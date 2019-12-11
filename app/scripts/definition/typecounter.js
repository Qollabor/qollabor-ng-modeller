/**
 * Helper class for creating new names and/or IDs within a given ModelDefinition.
 */
class TypeCounter {
    /**
     * Simple type counter class for counting types of cmmn element definitions
     * @param {ModelDefinition} modelDefinition 
     */
    constructor(modelDefinition) {
        this.modelDefinition = modelDefinition;
        this.guid = this.modelDefinition.parseAttribute('guid', Util.createID());
    }

    getNextIdOfType(constructor) {
        const prefix = (constructor.prefix ? constructor.prefix + '_' : '') + this.guid + '_';
        let counter = 0;
        while (this.modelDefinition.getElement(prefix+counter) !== undefined) counter++;
        return prefix + counter;
    }

    getNextNameOfType(constructor) {
        const prefix = this.getTypeName(constructor) + '_';
        let counter = 0;
        while (this.modelDefinition.elements.find(element => element.name == prefix+counter) !== undefined) counter++;
        return prefix + counter;
    }

    getTypeName(constructor) {
        const definitionCharacter = constructor.name.indexOf('Definition');
        if (definitionCharacter > 0) {
            return constructor.name.substring(0, definitionCharacter);
        } else {
            return constructor.name;
        }
    }
}
