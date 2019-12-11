'use strict';

const XMLSerializer = require('xmldom').XMLSerializer;
const DOMParser = require('xmldom').DOMParser;

class XML {
    /** 
     * Parses the xml string and returns the documentElement
     * @param {String} string 
     * @returns {Element}
     */
    static loadXMLElement(string) {
        return new DOMParser().parseFromString(string).documentElement;
    }

    /**
     * Returns an Array of elements matching the tagname. For easy iteration (foreach, map, filter, etc)
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static findElementsWithTag(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            elementsArray.push(nodes[i]);
        }
        return elementsArray;
    }

    /**
     * Returns an Array of elements that are direct children of xmlNode with the matching tagname. For easy iteration (foreach, map, filter, etc)
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static findChildrenWithTag(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.parentNode == xmlNode) {
                elementsArray.push(nodes[i]);
            }
        }
        return elementsArray;
    }

    /**
     * Pretty prints an XML string or node, based on regular expressions.
     * @param {Element | Document} object 
     */
    static printNiceXML(object) {
        const createShiftArr = (step) => {
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

exports.XML = XML;
