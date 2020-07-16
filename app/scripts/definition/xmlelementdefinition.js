class XMLElementDefinition {
    /**
     * Creates a new XMLElementDefinition that belongs to the Definition object.
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        this.importNode = importNode;
        this.modelDefinition = modelDefinition;
        if (!modelDefinition && this instanceof ModelDefinition) {
            this.modelDefinition = this;
        } else {
            this.modelDefinition.elements.push(this);
        }
        this.parent = parent;
        this.childDefinitions = [];
        if (this.parent) {
            this.parent.childDefinitions.push(this);
        }
    }

    /**
     * Parses the attribute with the given name into a boolean value.
     * If the attribute does not exist, if will return the default value.
     * @param {*} name
     * @param {Boolean} defaultValue
     * @returns {Boolean}
     */
    parseBooleanAttribute(name, defaultValue) {
        const value = this.parseAttribute(name, defaultValue);
        if (typeof (value) == 'string') {
            if (value.toLowerCase() == 'false') return false;
            if (value.toLowerCase() == 'true') return true;
        }
        return defaultValue;
    }

    /**
     * 
     * @param {String} name 
     * @param {Number} defaultValue 
     * @returns {Number}
     */
    parseNumberAttribute(name, defaultValue = undefined) {
        const value = this.parseAttribute(name, defaultValue);
        const number = parseInt(value);
        if (isNaN(number)) {
            return defaultValue;
        } else {
            return number;
        }
    }

    /**
     * Parses the attribute with the given name. If it does not exist, returns the defaultValue
     * @param {String} name 
     * @param {*} defaultValue 
     * @returns {String}
     */
    parseAttribute(name, defaultValue = undefined) {
        if (this.importNode) {
            const value = this.importNode.getAttribute(name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, returns it's text content as string.
     * @param {String} childName 
     * @param {String} defaultValue
     * @returns {String}
     */
    parseElementText(childName, defaultValue) {
        const childElement = XML.getChildByTagName(this.importNode, childName);
        if (childElement) {
            return childElement.textContent;
        }
        return defaultValue;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, instantiates it with the constructor and returns it.
     * @param {String} childName 
     * @param {Function} constructor 
     * @returns {*}
     */
    parseElement(childName, constructor) {
        return this.instantiateChild(XML.getChildByTagName(this.importNode, childName), constructor);
    }

    /**
     * Searches for all child elements with the given name, instantiates them with the constructor and adds them to the collection.
     * @param {String} childName 
     * @param {Function} constructor 
     * @param {*} collection 
     * @returns {Array<*>}
     */
    parseElements(childName, constructor, collection = [], node = this.importNode) {
        XML.getChildrenByTagName(node, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, instantiates it with the constructor and returns it.
     * @param {String} childName The name of the xml element inside the extensionElements
     * @param {Function} constructor 
     * @param {Function} extensionType
     * @returns {*}
     */
    parseExtensionElement(constructor, childName = constructor.TAG, extensionType = CafienneExtension) {
        const tagname = CafienneExtension.TAG;
        const cafienneExtension = this.parseExtension(extensionType, extensionType.TAG);
        return cafienneExtension ? cafienneExtension.parseElement(childName, constructor) : undefined;
    }

    /**
     * Parses the <cafienne:implementation> node from <extensionElements>. If present, then an instance of the constructor is returned for it.
      * 
      * @param {Function} constructor 
      * @param {String} tagName
      * @returns {*} an instance of the given constructor if the extension element is found.
      */
    parseExtension(constructor = CafienneExtension, tagName = IMPLEMENTATION_TAG) {
        this.extensionElement = XML.getChildByTagName(this.importNode, 'extensionElements');
        const extensionImplementation = this.instantiateChild(XML.getChildByTagName(this.extensionElement, tagName), constructor);
        return extensionImplementation;
    }

    /**
     * Instantiates a new XMLElementDefinition based on the child node, or undefined if the childNode is undefined.
     * The new cmmn element will be optionally added to the collection, which can either be an Array or an Object.
     * In an Object it will be placed with the value of it's 'id' attribute.
     * @param {Node} childNode 
     * @param {Function} constructor 
     * @param {*} collection 
     */
    instantiateChild(childNode, constructor, collection = undefined) {
        if (!childNode) {
            return undefined;
        }

        const newChild = new constructor(childNode, this.modelDefinition, this);
        if (collection) {
            if (collection.constructor.name == 'Array') {
                collection.push(newChild);
            } else { // Treat collection as an object
                collection[newChild.id] = newChild;
            }
        }
        return newChild;
    }

    /**
     * Creates a new XMLElementDefinition instance with the specified start position (x, y).
     * The start position is used to generate a default shape once the element is being rendered.
     * @param {Function} constructor 
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} id 
     * @param {String} name 
     */
    createShapedDefinition(constructor, x, y, id = undefined, name = undefined) {
        const element = this.createDefinition(constructor, id, name);
        element.__startPosition = { x, y };
        return element;
    }

    /**
     * Creates a new instance of the constructor with an optional id and name
     * attribute. If these are not given, the logic will generate id and name for it based
     * on the type of element and the other content inside the case definition.
     * @param {Function} constructor 
     * @param {String} id 
     * @param {String} name 
     * @returns {*} an instance of the constructor that is expected to extend CMMNElementDefinition
     */
    createDefinition(constructor, id = undefined, name = undefined) {
        const element = new constructor(undefined, this.modelDefinition, this);
        element.id = id ? id : this.modelDefinition.getNextIdOfType(constructor);
        if (name || element.isNamedElement()) {
            element.name = name ? name : this.modelDefinition.getNextNameOfType(constructor);
        }
        return element;
    }

    isNamedElement() {
        return true;
    }

    /**
     * Method invoked after deletion of some other definition element
     * Can be used to remove references to that other definition element.
     * @param {XMLElementDefinition} removedElement 
     */
    removeDefinitionReference(removedElement) {
        for (const key in this) {
            /** @type {*} */
            const value = this[key];
            if (value === removedElement) {
                // console.log("Deleted value "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                delete this[key];
            } else if (value instanceof Array) {
                const removed = Util.removeFromArray(value, removedElement);
                // if (removed > -1) {
                //     console.log("Removed "+element.constructor.name+" from "+this.constructor.name+"["+this.name+"]"+"."+key+"[]");
                // }
            } else if (typeof (value) === "string") {
                // If it is a string, and it has a non-empty value, and they are equal (and 'this !== removedElement', as that is the first check)
                if (value && removedElement.id && value === removedElement.id) {
                    // console.log("Deleting string reference "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                    console.log('Clearing ' + key + ' "' + removedElement.id + '" from ' + this);
                    this.removeProperty(key);
                    delete this[key];
                }
            } else {
                // console.log("Found property "+key+" which is of type "+typeof(value));
            }
        }
    }

    /**
     * Invoked right before the property is being deleted from this object
     * @param {String} propertyName 
     */
    removeProperty(propertyName) {
    }

    removeDefinition(log = true) {
        if (log) console.group("Removing " + this);
        // First, delete our children in the reverse order that they were created.
        this.childDefinitions.slice().reverse().forEach(child => {
            console.group('Removing ' + child);
            child.removeDefinition(false);
            // console.groupEnd();
        });
        // Next, inform the case definition about it.
        this.modelDefinition.removeDefinitionElement(this);
        // Finally remove all our properties.
        for (const key in this) delete this[key];
        console.groupEnd();
    }

    /**
     * Introspects the properties by name and exports them to XML based on their type.
     * @param {Array} propertyNames 
     */
    exportProperties(...propertyNames) {
        propertyNames.forEach(propertyName => {
            if (typeof (propertyName) == 'string') {
                this.exportProperty(propertyName, this[propertyName]);
            } else { // Probably an array
                if (propertyName.constructor.name == 'Array') { // It is actually an array of something (e.g. of string or even again of array)
                    propertyName.forEach(name => this.exportProperties(name));
                } else {
                    console.warn('Cannot recognize property name, because it is not of type string or array but ' + propertyName.constructor.name + '\n', propertyName);
                }
            }
        });
    }

    /**
     * Exports the property with the given name and value into XML. PropertyValue can be anything,
     * and it's type determines how the property is exported to XML. If it is undefined or null, nothing happens.
     * If it is an array, each individual element will be inspected and exported (invoking this method recursively).
     * If it is an instanceof CMMNElementDefinition (i.e., if it is a child property), then the createExportNode of that child is invoked with
     * this.exportNode as the parentNode.
     * If it is something else, then it is exported as an xml attribute.
     * @param {String} propertyName 
     * @param {*} propertyValue 
     */
    exportProperty(propertyName, propertyValue) {
        // Do not write '' or 'undefined' attributes.
        if (propertyValue === undefined) return;
        if (propertyValue === '') return;
        // Hmmmm.... Null properties is bad code smell?
        if (propertyValue === null) return;
        if (propertyValue.constructor.name == 'Array') {
            // Convert arrays into individual property-writes
            propertyValue.forEach(singularPropertyValue => this.exportProperty(propertyName, singularPropertyValue));
        } else if (propertyValue instanceof XMLElementDefinition) {
            // Write XML properties as-is, without converting them to string
            propertyValue.createExportNode(this.exportNode, propertyName);
        } else {
            if (typeof (propertyValue) == 'object') {
                console.warn('Writing property ' + propertyName + ' has a value of type object', propertyValue);
            }
            if (propertyName == 'description' && this instanceof CMMNElementDefinition && !this.__description) {
                // Do not write description if it is not specifically set.
                return;
            }
            if (propertyName == 'name' && this instanceof CMMNElementDefinition && !this.__name) {
                // Do not write name either if it is not specifically set.
                return;
            }

            // Convert all values to string
            const stringifiedValue = propertyValue.toString()
            // If the "toString" version of the property still has a value, then write it into the attribute
            if (stringifiedValue) { 
                this.exportNode.setAttribute(propertyName, propertyValue);
            }
        }
    }

    /**
     * Exports this element with its properties to an XML element and appends it to the parentNode.
     * If first creates the .exportNode XML element, then exports id, name and description attributes to it
     * and finally introspects each of the given property names and invokes the appropriate export logic on it.
     * @param {Node} parentNode 
     * @param {String} tagName 
     * @param {Array} propertyNames
     */
    createExportNode(parentNode, tagName, ...propertyNames) {
        this.exportNode = XML.createChildElement(parentNode, tagName);
        this.exportProperties(propertyNames);
    }

    /**
     * Creates and returns an extension element with a custom tag inside having the given tagName (it defaults to <cafienne:implementation>).
     * Sets the namespace attribute to 'org.cafienne'
     * Does NOT set the class attribute on it (e.g. for WorkflowTaskDefinition)
     * @param {String} tagName 
     */
    exportExtensionElement(tagName = IMPLEMENTATION_TAG) {
        const extensionElements = XML.createChildElement(this.exportNode, 'extensionElements');
        extensionElements.setAttribute('mustUnderstand', 'false');
        const node = XML.createChildElement(extensionElements, tagName);
        node.setAttribute(IMPLEMENTATION_PREFIX, IMPLEMENTATION_NAMESPACE);
        return node;
    }

    /**
     * Basic method invoked on an element after the entire XML tree has been parsed.
     * Can be used to resolve string based references to other elements.
     * @deprecated - belongs in elements/view layer, rather than in definitions layer
     */
    resolveReferences() { }

    /**
     * Just prior to exporting a definition to XML, flattenReferences() is invoked on each definition element,
     * in order to create the proper string contents for attributes like 'entryCriteriaRefs', 'definitionRef', etc.
     * @deprecated flattenReferences() and resolveReferences() are wrong-patterned. They do not belong in definition layer
     */
    flattenReferences() { }

    /**
     * Exports the IDs of all elements in the list (that have an id) into a space-separated string
     * @param {Array} list 
     */
    flattenListToString(list) {
        return list && list.length > 0 ? list.filter(item => item.id).map(item => item.id).join(' ') : undefined;
    }

    toString() {
        return this.constructor.name;
    }

    /**
     * Prints a log message that shows the difference between the import and the export node of this element.
     */
    logDiff() {
        console.group('Import and export nodes for ' + this);
        console.log('Imported node: ' + XML.prettyPrint(this.importNode));
        console.log('Export node: ' + XML.prettyPrint(this.exportNode));
        console.groupEnd();
    }
}
