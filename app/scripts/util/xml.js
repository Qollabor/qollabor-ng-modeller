class XML {
    /**
     * Parses the given xml string into a Document object
     * @param {String|Node} xml
     * @returns {Document}
     */
    static parseXML(xml) {
        if (xml instanceof Document) {
            return xml;
        } else if (xml instanceof Node) {
            return xml.ownerDocument;
        }
        const xmlDocument = XML.loadXMLString(xml);
        if (XML.isValidXMLImport(xmlDocument)) {
            return xmlDocument;
        } else {
            return null;
        }
    }

    /**
     * returns an xml document based on the passed string
     * @param {String} txt 
     * @returns {Document}
     */
    static loadXMLString(txt) {
        if (DOMParser) {
            return new DOMParser().parseFromString(txt, 'text/xml');
        } else {
            // code for IE
            const xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = false;
            xmlDoc.loadXML(txt);
            return xmlDoc;
        }
    }

    /**
     * returns true when the xmlDef has no errors, false when there are errors during parsing of XML
     * @param {Document} xmlDef 
     * @param {Boolean} bSuppressErrorMessage 
     * @returns {Boolean}
     */
    static isValidXMLImport(xmlDef, bSuppressErrorMessage = false) {
        if (DOMParser) { // code for all but IE
            const parseErrors = xmlDef.getElementsByTagName('parsererror');
            if (parseErrors.length > 0) {
                const fChild = parseErrors[0];
                if (!bSuppressErrorMessage) {
                    ide.warning(fChild.textContent);
                }
                return false;
            }
        }
        return true;
    }

    /**
     * Creates a child element with the specified tagName and appends it to the parentNode
     * @param {Node} parentNode 
     * @param {String} tagName 
     * @returns {Element} The newly created element
     */
    static createChildElement(parentNode, tagName) {
        return parentNode.appendChild(parentNode.ownerDocument.createElement(tagName));
    }

    /**
     * Creates a text node with the specified text and appends it to the parentNode
     * @param {Node} parentNode 
     * @param {String} text 
     * @returns {Text} The newly created element
     */
    static createTextChild(parentNode, text) {
        return parentNode.appendChild(parentNode.ownerDocument.createTextNode(text));
    }

    /**
     * Returns the first element child of xmlNode that has the corresponding tagName, or undefined. 
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Element}
     */
    static getChildByTagName(xmlNode, tagName) {
        const children = XML.getChildrenByTagName(xmlNode, tagName);
        return children.length > 0 ? children[0] : undefined;
    }

    /**
     * Wrapper function around DOM.getElementsByTagName, but yielding only direct children of XML node.
     * Returns an Array.
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static getChildrenByTagName(xmlNode, tagName) {
        const elementsArray = [];
        XML.getElementsByTagName(xmlNode, tagName).forEach(element => {
            if (element.parentNode == xmlNode) elementsArray.push(element);
        });
        return elementsArray;
    }

    /**
     * Returns an array with all elements under the given XML node
     * @param {Document | Element | Node} xmlNode 
     * @param {Array<Element>} array Optionally provide an array to which the elements will be added, or one will be created
     */
    static allElements(xmlNode, array = []) {
        xmlNode && xmlNode.childNodes.forEach(child => {
            if (child instanceof Element) {
                array.push(child);
                this.allElements(child, array);
            }
        })
        return array;
    }

    /**
     * Wrapper function around DOM.getElementsByTagName, returning an array that can be 
     * looped over with a forEach function. If the xmlNode is undefined, an empty array will be returned.
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static getElementsByTagName(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            elementsArray.push(nodes[i]);
        }
        return elementsArray;
    }

    /**
     * returns the <![CDATA[..]]> node which is a child of the parentNode. If there is no such node
     * then the parentNode will be returned.
     * For most browsers the CDATA node is the second child of the parentNode, but not always. So look for 'cdata' in the nodename
     * @param {*} parentNode 
     */
    static getCDATANodeOrSelf(parentNode) {
        for (let i = 0; i < parentNode.childNodes.length; i++) {
            const childNode = parentNode.childNodes[i];
            if (childNode.nodeName.toLowerCase().search('cdata') >= 0) {
                return childNode;
            }
        }
        return parentNode;
    }

    /**
     * Pretty prints an XML string or node, based on regular expressions.
     * @param {*} object 
     */
    static prettyPrint(object) {
        if (! object) return '';
        // Algorithm below takes a string and formats it; if an XML node is passed, we first serialize it to string.
        const text = typeof (object) == 'string' ? object : new XMLSerializer().serializeToString(object);
        //  This code is based on jquery.format.js by Zach Shelton
        //  https://github.com/zachofalltrades/jquery.format        
        const shift = createShiftArr('    '); // 4 spaces
        const ar = text.replace(/>\s{0,}</g, '><')
            .replace(/</g, '~::~<')
            .split('~::~'),
            len = ar.length;
        let inComment = false,
            deep = 0,
            str = '';

        for (let ix = 0; ix < len; ix++) {

            // start comment or <![CDATA[...]]> or <!DOCTYPE //
            if (ar[ix].search(/<!/) > -1) {

                str += shift[deep] + ar[ix];
                inComment = true;
                // end comment  or <![CDATA[...]]> //
                if (ar[ix].search(/-->/) > -1
                    || ar[ix].search(/\]>/) > -1
                    || ar[ix].search(/!DOCTYPE/) > -1) {

                    inComment = false;
                }
            } else

                // end comment  or <![CDATA[...]]> //
                if (ar[ix].search(/-->/) > -1
                    || ar[ix].search(/\]>/) > -1) {

                    str += ar[ix];
                    inComment = false;
                } else

                    // <elm></elm> //
                    if (/^<\w/.exec(ar[ix - 1])
                        && /^<\/\w/.exec(ar[ix])
                        && /^<[\w:\-\.\,]+/.exec(ar[ix - 1]) == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/', '')) {

                        str += ar[ix];
                        if (!inComment) deep--;
                    } else

                        // <elm> //
                        if (ar[ix].search(/<\w/) > -1
                            && ar[ix].search(/<\//) == -1
                            && ar[ix].search(/\/>/) == -1) {

                            str = !inComment ? str += shift[deep++] + ar[ix] : str += ar[ix];
                        } else

                            // <elm>...</elm> //
                            if (ar[ix].search(/<\w/) > -1
                                && ar[ix].search(/<\//) > -1) {

                                str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
                            } else

                                // </elm> //
                                if (ar[ix].search(/<\//) > -1) {

                                    str = !inComment ? str += shift[--deep] + ar[ix] : str += ar[ix];
                                } else

                                    // <elm/> //
                                    if (ar[ix].search(/\/>/) > -1) {

                                        str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
                                    } else

                                        // <? xml ... ?> //
                                        if (ar[ix].search(/<\?/) > -1) {

                                            str += shift[deep] + ar[ix];
                                        } else

                                            // xmlns //
                                            if (ar[ix].search(/xmlns\:/) > -1
                                                || ar[ix].search(/xmlns\=/) > -1) {

                                                str += shift[deep] + ar[ix];
                                            }
                                            else {

                                                str += ar[ix];
                                            }
        }

        return (str[0] == '\n') ? str.slice(1) : str;
    }
}

/**
 * utility function called from constructor of Formatter
 */
function createShiftArr(step) {
    let space = '    ';
    if (isNaN(parseInt(step))) {  // argument is string
        space = step;
    } else { // argument is integer
        space = new Array(step + 1).join(' '); //space is result of join (a string), not an array
    }
    const shift = ['\n']; // array of shifts
    for (let ix = 0; ix < 100; ix++) {
        shift.push(shift[ix] + space);
    }
    return shift;
}
