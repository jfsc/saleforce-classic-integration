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
  test('Spaced path', () => {
    try {
      const dir = workingwithpath.normalize(`${homedir}/.sfci/tmp/Projeto X - foo bar/REPO_NAME/src-files`);
      const wspace = vscode.workspace.rootPath;
      const metadatasample = workingwithpath.normalize(`${wspace}/resources/metadata`);
      const uri = vscode.Uri.parse(`${dir}/metadata/package.xml`);
      fs.mkdir(dir, { recursive: true }, (err:any) => { throw err; });
      ncp(`${metadatasample}`, `${dir}`);
      myExtension.deployPack(uri);
    } catch (error) {
      console.log(error)
    }
  });
});
