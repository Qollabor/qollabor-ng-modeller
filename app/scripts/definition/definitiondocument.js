class DefinitionDocument extends DefinitionParser {
    /**
     * @returns {DefinitionDocument}
     * returns a empty cmmn model
     * @param {String} caseName The name of the case
     * @param {String} caseDescription The description of the case
     * @param {Number} width The width of the case plan model
     * @param {Number} height The height of the case plan model
     * @param {Number} x The upper-left corner of the case plan model
     * @param {Number} y The upper-left corner of the case plan model
     */
    static createNewDefinitionDocument(caseName, caseDescription, width, height, x, y) {
        const caseID = caseName + '.case';
        const guid = Util.createID();

        const casePlanId = `cm_${guid}_0`;
        const caseString = 
`<case id="${caseID}" name="${caseName}" description="${caseDescription}" guid="${guid}">
    <caseFileModel/>
    <casePlanModel id="${casePlanId}" name="${caseName}"/>
</case>`;
                
        const dimensionsString = 
`<${CMMNDI}>
    <${CMMNDIAGRAM}>
        <${CMMNSHAPE} ${CMMNELEMENTREF}="${casePlanId}" name="${caseName}">
            <${BOUNDS} x="${x}" y="${y}" width="${width}" height="${height}" />                    
        </${CMMNSHAPE}>
    </${CMMNDIAGRAM}>
    <validation>
        <hiddennotices />
        <hiddenproblems />
    </validation>
</${CMMNDI}>`;
        
        return new DefinitionDocument(ide, caseString, dimensionsString, caseName + '.case', caseName + '.dimensions');
    }

    /**
     * 
     * @param {IDE} ide 
     * @param {String} caseString 
     * @param {String} dimensionsString 
     */
    constructor(ide, caseString, dimensionsString, caseFileName, dimensionsFileName) {
        super(ide);
        this.caseString = caseString;
        this.dimensionsString = dimensionsString;
        this.caseFileName = caseFileName;
        this.dimensionsFileName = dimensionsFileName;

        // Parse the strings into XML documents the CMMN definition and dimensions
        this.caseDocument = XML.parseXML(caseString);
        this.dimensionsDocument = XML.parseXML(dimensionsString);

        this.caseNode = this.caseDocument && XML.getChildByTagName(this.caseDocument, 'case');
        const diagramNodes = this.dimensionsDocument && this.dimensionsDocument.getElementsByTagName(CMMNDIAGRAM) || [];        
        this.dimensionsNode = diagramNodes.length > 0 ? diagramNodes[0] : undefined;
    }

    get invalid() {
        if (!this.caseDocument) {
            this.ide.danger('Cannot import because definition does not contain proper XML');
            return true;
        }

        if (!this.dimensionsDocument) {
            this.ide.danger('Cannot import because dimensions does not contain proper XML');
            return true;
        }

        // Also check if we have a case at all...
        if (!this.caseNode) {
            this.ide.danger('Cannot import because &lt;case&gt; node is missing');
            return true;
        }

        if (!this.dimensionsNode) {
            this.ide.danger('The node &lt;' + CMMNDIAGRAM + '&gt; could not be found in the dimensions document');
            return true;
        }
        return false;
    }

    /**
     * @returns {Dimensions}
     */    
    get dimensions() {
        if (!this._dimensions) {
            this._dimensions = new Dimensions(this.dimensionsNode, this);
        }
        return this._dimensions;
    }

    /**
     * @returns {CaseDefinition}
     */    
    get caseDefinition() {
        if (!this._caseDefinition) {
            this._caseDefinition = new CaseDefinition(this.caseNode, this, this.dimensions);
            this._caseDefinition.parse();
        }
        return this._caseDefinition;
    }

    /**
     * Returns a pretty printed XML string of the current case definition
     */
    get definitionsXML() {
        return XML.prettyPrint(this.caseDefinition.toXML());
    }

    /**
     * Returns a pretty printed XML string of the dimensions of the current case definition
     */
    get dimensionsXML() {
        return XML.prettyPrint(this.dimensions.toXML());
    }

    /**
     * Returns the name of the model without the '.case' or '.dimensions' extension
     */
    get name() {
        return this.caseDefinition.name;
    }
}