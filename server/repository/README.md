#Repository
Repository is a [Node.js](http://nodejs.org) library for storing, retrieving and deploying of CMMN models.

##URLs
The repository can be accessed on URL http:/localhost:2081 and supports the following operations:

+ /repository/load/fileName (fileName including file extension)
+ /repository/save/fileName (fileName including file extension)
+ /repository/list (retrieve all available models with last modified information and usage information)
+ /repository/viewCMMN/modelname (combine all CMMN models (cases/processes) to one CMMN model)
+ /repository/validate/modelname (combine all CMMN models (cases/processes) to one CMMN model)
+ /repository/deploy/modelname (combine all CMMN models (cases/processes/humantask/cfid) to one &lt;definitions> document and store this in the deployment folder)

Example: http://localhost:2081/repository/load/helloworld.case

##Deploy
The current deployment processes executing the following steps:

1. Retrieve the main CMMN case including all dependent cases and used processes
2. Store CMMN model in deploy folder
3. (in future publish to case engine.)

##File extensions
The following file extensions are used in the repository.

+ .case: for CMMN case models
+ .dimensions: for the CMMN case dimensions - the case DI information is stored independently, in order to allow for a SCM history
that separates semantic changes from visual changes.
+ .process: for the CMMN processes
+ .humantask: for the custom implementations of the CMMN HumanTask element
+ .cfid: for CMMN case file item definitions

##Packages
Support for packages is provided by adding slashes.

Example: qollabor/org/helloworld

##Configuration
File /config/config.js.

+ repository: folder where the CMMN models are stored
+ deploy: folder where the deployed CMMN models are stored

##Examples

    const repositoryLib = require('../../routes/repository');

    Repository = repositoryLib.Repository;
    const repository = new Repository('./repository', './repository_deploy');
    
    // loading of data from repository
    repository.load("helloworld.case");
    repository.load("helloworld.dimensions");
    
    // saving data to repository
    repository.save("helloworld.case", content);
    repository.save("helloworld.dimensions", content);
    repository.save("webservice.process", content);

    // deploying of a case
    repository.deploy("helloworld");
    
    // viewing the combined CMMN model
    const definitions = repository.composeDefinitionsDocument("helloworld");
    const cmmn = definitions.getXML();
    // output: definitions document with all references to sub cases, processes, human tasks, etc. inlined.
    // definition.hasErrors indicates an error may have happened
    
    // list all available models
    const result = repository.list();


## Command Line deployment

npm run deploy <model> [repository=...] [deploy=...]
