"use strict";

const assert = require('assert');
const Store = require("../repository/store").Store;
const Definitions = require("../repository/cmmn/definitions").Definitions;
const consts = require('../repository/constant.js');

describe("Store tests", function () {

  let repositoryDir = __dirname + '/repository/';

  it("definitions", () => {
    let store = new Store(repositoryDir);
    const definitions = new Definitions('helloworld.case', store);
    const xml = definitions.deployContents;
    assert(xml != null);
    //console.log(xml);
  });

});
