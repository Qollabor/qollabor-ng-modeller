'use strict';

const config = require('../../config/config');
const repositoryModule = require('./repository');
const Repository = repositoryModule.Repository;

function parseArguments(argv) {
    const options = new Map();
    let argCounter = 0;
    for (const arg of argv) {
        let key;
        let value;
        if (arg.indexOf('=') > -1) {
            const values = arg.split('=');
            key = values[0];
            value = values[1];
        } else {
            key = `arg${++argCounter}`;
            value = arg;
        }
        options[key] = value;
    }
    return options;
}

const options = parseArguments(process.argv.slice(2));
const action = options['arg1'];
const model = options['arg2'];
const repositoryFolder = options['repository'] || config.repository;
const deployFolder = options['deploy'] || config.deploy;

const repository = new Repository(repositoryFolder, deployFolder);

switch (action) {
case 'deploy':
    console.log(`Start deployment of ${model}`);
    repository.deploy(model);
    console.log('Finished deployment');
    break;
}