'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const config = require('../../config/config');
const repositoryModule = require('./repository');
const Repository = repositoryModule.Repository;
const repository = new Repository(config.repository, config.deploy);

const backend = require('./backend_rest');
const caseService = new backend.Backend(config.backendUrl);

const router = express.Router();
const xmlParser = bodyParser.text({ type: 'application/xml' });

/**
 * Returns the repository contents by name and last modified timestamp
 */
router.get('/list', function(req, res, next) {
    const list = repository.list();
    res.json( list );
});

/**
 *  Get a file from the repository.
 */
router.get('/load/*', function(req, res, next) {
    const filename = req.params[0];
    try {
        const content = repository.load(filename);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('x-sent', 'true');
        res.send(content);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File does not exist, just return an empty string
            res.sendStatus(404);
        } else {
            console.error(err);
            res.sendStatus(500);
        }
    }
});

/**
 * Save a file to the repository
 */
router.post('/save/*', xmlParser, function(req, res, next) {
    try {
        const filename = req.params[0];
        repository.save(filename, req.body);

        const list = repository.list();
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Show the dependencies on the specified model, i.e., all models that have a reference to this model
 */
router.get('/usage/*', function (req, res, next) {
    try {
        const artifactId = req.params[0];
        const response = repository.usage(artifactId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('x-sent', 'true');
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Deploy a file and it's dependencies from the repository to the deployment folder
 */
router.get('/deploy/*', xmlParser, function(req, res, next) {
    const artifactToDeploy = req.params[0];
    try {
        const deployedFile = repository.deploy(artifactToDeploy);
        console.log('Deployed ' + artifactToDeploy + ' to ' + deployedFile);
        res.setHeader('Content-Type', 'application/xml');
        res.status(201).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Preview what the deployment of a file and it's dependencies looks like
 */
router.get('/viewCMMN/*', (req, res, next) => {
    try {
        const filename = req.params[0];

        const definitions = repository.composeDefinitionsDocument(filename);
        const response = definitions.deployContents;
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('x-sent', 'true');
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Validate a potential deployment file (with it's dependencies) against a configured Backend Service
 */
router.get('/validate/*', (req, res, next) => {
    const filename = req.params[0];
    const definitions = repository.composeDefinitionsDocument(filename);
    if (definitions.hasErrors()) {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(definitions.getErrors());
        return;
    }
    const cmmnSource = definitions.deployContents;

    if (config.backendUrl === undefined) {
        res.status(503);
        res.send('There is no case service configured for engine based validation');
        return;
    };

    // Current protocol with backend is that it returns 200 if the content is valid, and 400 otherwise;
    //  We convert this to our own protocol with our client.
    caseService.validate(cmmnSource)
        .then((data) => {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send('["The model is valid"]');
        })
        .catch(err => {
            if (err.statusCode == 400) {
                res.status(200);
                res.setHeader('Content-Type', 'application/json');
                res.send(err.response.body);
            } else if (err.statusCode == 404) {
                // Validate API is not yet implemented/available in the backend
                res.status(503); // 503 Service Unavailable
                res.send('The backend engine does not yet support the validation API');
            } else {
                res.status(503); // 503 Service Unavailable
                res.send(err.message)
            }
        });
});

router.get('/api/events/*', (req, res, next) => {
    const caseInstanceId = req.params[0];
    caseService.getEvents(caseInstanceId, req.header('CAFIENNE-JWT-TOKEN')).then(data => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(data.body);
    }).catch(err => {
        res.status(err.statusCode);
        res.send(err.response.body);
    })
})

module.exports = router;
