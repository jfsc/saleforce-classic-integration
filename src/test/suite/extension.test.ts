/* eslint-disable no-undef */
/* eslint-disable semi */
// import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
const fs = require('fs');
const workingwithpath = require('path');
const homedir = require('os').homedir();
const ncp = require('ncp').ncp;

suite('Deploy Classic Metadata', () => {
  vscode.window.showInformationMessage('Start all tests.');
  test('Spaced path', (done) => {
    try {
      const dir = workingwithpath.normalize(`${homedir}/.sfci/tmp/Projeto X - foo bar/REPO_NAME/src-files`);
      const metadatasample = workingwithpath.normalize(`${__dirname}/../../../resources/metadata`);
      const uri = vscode.Uri.parse(`${dir}/metadata/package.xml`);
      fs.mkdirSync(dir, { recursive: true }, (err:any) => { throw err; });
      ncp(`${metadatasample}`, `${dir}`);
      // myExtension.deployPack(uri).catch((error) => { console.error(error); done() });
      myExtension.deployPack(uri).catch((rej) => { console.error('huston we have a problem'); done(); throw new Error(rej); });
    } catch (error) {
      console.log(error);
      // console.error('Failed to run tests');
    }
  });
});
