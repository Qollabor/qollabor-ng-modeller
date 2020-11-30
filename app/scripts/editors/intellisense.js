'use strict';

class ArrayToken {
    constructor(text) {
        this.text = text;
    }
}

class DotToken {
}

class Token {
    constructor(text) {
        this.text = text;
    }
}

class SimpleCaseFileItem {
    constructor() {
        this.id = null;
        this.name = null;
        this.children = null;
        this.properties = null;
        this.multiplicity = null;
        this.definitionRef = null;
        this.rootCaseFileItem = null;
    }
}

/**
 * This class implements autocomplete logic for CaseFileItems using the SPEL expression syntax.
 */
class IntelliSenseSpel {

  /**
   * Constuctor.
   *
   * @param simpleCaseFile
   */
    constructor(simpleCaseFile) {
        this.simpleCaseFile = simpleCaseFile;
    }

  /**
   * Generated autocomplete suggestions.
   *
   * @param context The caseFileItem id
   * @param text
   * @returns {Array}
   */
    suggestions(context, text) {
        const tokens = IntelliSenseSpel.tokenize(text);
        if (tokens === null) {
            return [];
        }

        let suggestionsArr = [];
        const tokensMinusLast = tokens.slice(0, tokens.length-1);
        const caseFileItem = this._getCaseFileItem(tokensMinusLast, context);
        if (caseFileItem != null) {
            const lastToken = tokens[tokens.length-1];
            suggestionsArr = IntelliSenseSpel._getMatches(lastToken, caseFileItem)
        }
        return suggestionsArr;
    }

    _getCaseFileItem(tokens, context) {
        let caseFileItem = this._getCaseFileByContext(context);
        if (!caseFileItem) {
            return null;
        }

        for (const token of tokens) {
            if (token instanceof DotToken) {
                continue;
            }
            caseFileItem = IntelliSenseSpel._getCaseFileItemByName(token, caseFileItem);
            if (caseFileItem === null) {
                break;
            }
        }
        return caseFileItem;
    }

    _getCaseFileByContext(context) {
        let simpleCaseFile;
        if (context == null) {
            simpleCaseFile = this.simpleCaseFile;
        } else {
      // create a root tag 'children' to have same structure as for caseFile without a context.
            const result = jsonPath.eval(this.simpleCaseFile, '$..[?(@.id==\'' + context + '\')]');
            if (result.length > 0) {
                const caseFileItemNameObj = {};
                caseFileItemNameObj[result[0].name] = result[0];
                simpleCaseFile = { 'children' : caseFileItemNameObj };
            }
        }
        return simpleCaseFile;

    }

    static _getCaseFileItemByName(token, caseFileItem) {
        if (caseFileItem.children != null && caseFileItem.children.hasOwnProperty(token.text)) {
            const _caseFileItem = caseFileItem.children[token.text];
            if (IntelliSenseSpel._isValidTokenType(token, _caseFileItem)) {
                return _caseFileItem;
            }
        }

        return null;
    }

    static _isValidTokenType(token, caseFileItem) {
        const multiplicity = caseFileItem.multiplicity;
        if (caseFileItem.rootCaseFileItem) {
            return !(token instanceof ArrayToken);
        }

        if ((token instanceof Token) && ['OneOrMore' || 'ZeroOrMore'].includes(multiplicity)) {
            return false;
        }
        return !((token instanceof ArrayToken) && !['OneOrMore' || 'ZeroOrMore'].includes(multiplicity));
    }

    static _getMatches(token, caseFileItem) {
        const suggestionsArr = [];
        if (caseFileItem.children != null) {
            const caseFileItemNames = Object.keys(caseFileItem.children);
            for (const caseFileItemName of caseFileItemNames) {
                if ((token instanceof DotToken) || caseFileItemName.startsWith(token.text)) {
                    suggestionsArr.push(caseFileItemName);
                }
            }
        }

        if (caseFileItem.properties != null) {
            for (const propertyName of caseFileItem.properties) {
                if ((token instanceof DotToken) || propertyName.startsWith(token.text)) {
                    suggestionsArr.push(propertyName);
                }
            }
        }
        return suggestionsArr;
    }

    static _isArray(text) {
        return (text.indexOf('[') > 0 || text.indexOf(']') > 0);
    }

    static _isDotToken(text) {
    // string.split will create empty string for '.' character.
        return text === '';
    }

    static _createArrayToken(text) {
        const re = /(\w+)\[\d+\]$/;
        const match = re.exec(text);
        return new ArrayToken(match[1]);
    }

    static tokenize(text) {
        const textParts = text.split('.');
        const tokens = [];
        for (const textPart of textParts) {
            let obj;
            if (IntelliSenseSpel._isArray(textPart)) {
                obj = IntelliSenseSpel._createArrayToken(textPart);
            } else if (IntelliSenseSpel._isDotToken(textPart)) {
                obj = new DotToken();
            } else {
                obj = new Token(textPart);
            }
            tokens.push(obj);
        }
        return tokens;
    }
}

/**
 * This class build an object tree with casefile and casefile definitions data
 * that is used for generation of IntelliSense.
 * See intellisense_test.js for a example of the generated object structure.
 */
class SimpleCaseFileBuilder {

    /**
     * 
     * @param {*} caseFileItemDefinition 
     * @param {CaseFileDefinition} cfiData 
     */
    build(caseFileItemDefinition, cfiData) {
        const caseFileItemDefinitionObjects = SimpleCaseFileBuilder._createCaseFileItemDefinitionObjects(caseFileItemDefinition);
        const objectTree = this._buildObjectTree(cfiData.children, caseFileItemDefinitionObjects, true);
        const result = {};
        result.children = objectTree;
        return result;
    }

    /**
     * 
     * @param {Array<CaseFileItemDef>} caseFileItemChildren 
     * @param {*} caseFileItemDefinitionObjects 
     * @param {*} rootCaseFileItem 
     */
    _buildObjectTree(caseFileItemChildren, caseFileItemDefinitionObjects, rootCaseFileItem) {
        const simpleCaseFileItems = {};
        for (const child of caseFileItemChildren) {
            const object = new SimpleCaseFileItem();
            object.name = child.name;
            object.id = child.id;
            object.children = null;
            object.rootCaseFileItem = rootCaseFileItem;
            if (child.children) {
                object.children = this._buildObjectTree(child.children, caseFileItemDefinitionObjects, false);
            }
            object.properties = null;
            object.multiplicity = child.multiplicity;
            // if (child.data.casefileitemdefinition && child.data.casefileitemdefinition.name) {
            //     const definitionRef = child.data.casefileitemdefinition.name;
            //     object.definitionRef = definitionRef;
            //     object.properties = caseFileItemDefinitionObjects[definitionRef];
            // }

            simpleCaseFileItems[object.name] = object;
        }
        return simpleCaseFileItems;
    }

    static _createCaseFileItemDefinitionObjects(caseFileItemDefinitionData) {
        const result = {};
        for (const cfiDefData of caseFileItemDefinitionData) {
            const name = cfiDefData.name;
            let properties = null;

        /*TODO After case file item definition change (save in separate files), 
        the unspecified data must be retrieved from the cfid file*. Skip for now*/

            //switch (cfiDefData.definitionType) {
            //case UNSPECIFIED_URI:
            //    properties = SimpleCaseFileBuilder.getCaseFileItemDefinitionsUnspecified(cfiDefData);
            //    break;
            //}
            result[name] = properties;
        }
        return result;
    }

    static getCaseFileItemDefinitionsUnspecified(cfiDefData) {
        const properties = [];
        const propertyDatas = cfiDefData.defTypeObject[UNSPECIFIED_URI].tree.fancytree('getRootNode').children;
        for (const propertyData of propertyDatas) {
            properties.push(propertyData.data.name);
        }
        return properties;
    }
}
