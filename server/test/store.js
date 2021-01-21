"use strict";

const fs = require('fs');
const assert = require('assert');
const Store = require("../repository/store").Store;
const consts = require('../repository/constant.js');

describe("Store tests", function () {
  let store;
  let repositoryDir = __dirname + '/repository/';

  beforeEach(() => {
    store = new Store(repositoryDir);
  });

  it("load", () => {
    const result = store.load("helloworld.case");
    assert(result != null);
  });

  function removeFile(f) {
    if (fs.existsSync(repositoryDir + f)) {
      fs.unlinkSync(repositoryDir + f);
    }
  }

  it("save", () => {
    removeFile('save.case');
    store = new Store(repositoryDir);
    store.save('save.case', `<definitions>
      <case id="save.case_save" name="save" description="save">
      <caseFileModel/>
      <casePlanModel id="cm_save.case_save_0" name="save"/>
      </case>
    </definitions>`);
    const fileCreated = fs.existsSync(repositoryDir + 'save.case');
    assert(fileCreated);
    removeFile('save.case');
  });

  it("getUsage", () => {
    store = new Store(repositoryDir);
    const result = store.getUsage("sendresponse.humantask");
    assert(result != null);
    const resultJson = JSON.stringify(result);
    assert(resultJson === `[{"id":"helloworld.case","name":"HelloWorld","description":"Hello World"}]`);
  });

  it("list", () => {
    const result = store.list(consts.CASE_EXT);
    assert(result.length == 6);
  });

});
