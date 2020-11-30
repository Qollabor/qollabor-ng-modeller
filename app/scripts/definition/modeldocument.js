class ModelDocument extends DefinitionParser {
    /**
     * 
     * @param {IDE} ide 
     * @param {String} fileName 
     * @param {String} source 
     */
    constructor(ide, fileName, source) {
        super(ide);
        this.fileName = fileName;
        this.source = source;
    }

    /**
     * Parses the source into XML, and returns an instance of the constructor.
     * @returns {ModelDefinition}
     * @param {Function} constructor 
     */
    parseModel(constructor) {
        return new constructor(XML.parseXML(this.source).documentElement, this);
    }

    /**
     * 
     * @param {IDE} ide 
     * @param {ServerFile} serverFile 
     */
    static parse(ide, serverFile) {
        const source = serverFile.data;
        const fileName = serverFile.fileName;
        const fileType = serverFile.fileType;
        if (fileType == 'case') {
            return new DefinitionDocument(ide, source, '<dimensions />', fileName, '').caseDefinition;
        } else if (fileType == 'process') {
            return new ModelDocument(ide, fileName, source).parseModel(ProcessModelDefinition);
        } else if (fileType == 'humantask') {
            return new ModelDocument(ide, fileName, source).parseModel(HumanTaskModelDefinition);
        } else if (fileType == 'dimensions') {
            return new DefinitionDocument(ide, '<case />', source, '', fileName).dimensions;
        } else if (fileType == 'cfid') {
            return new ModelDocument(ide, fileName, source).parseModel(CaseFileDefinitionDefinition);
        } else {
            throw new Error('FileType '+fileType+' is not supported');
        }
    }
}