/* eslint-disable no-undef */
/* eslint-disable semi */
// import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import { fail } from 'assert';
const fs = require('fs');
const workingwithpath = require('path');
const homedir = require('os').homedir();
const ncp = require('ncp').ncp;
const trash = require('trash');

suite('Deploy Classic Metadata', () => {
  vscode.window.showInformationMessage('Start all Deploy tests.');
  test('Spaced path', (done) => {
    try {
      const dir = workingwithpath.normalize(`${homedir}/.sfci/tmp/Projeto X - foo bar/src-salesforce`);
      const metadatasample = workingwithpath.normalize(`${__dirname}/../../../resources/metadata/`);
      const uri = vscode.Uri.file(`${dir}/package.xml`);
      fs.mkdir(dir, { recursive: true }, (err:Error) => { if (err) { console.error('FALHA NA CRIACAO DA PASTA'); throw err; } });
      ncp(`${metadatasample}`, `${dir}`, { clobber: false }, function (err:Error) {
        if (err) {
          return console.error(err);
        } else { console.log('COPIA DE METADADOS PARA TESTES DE DEPLOY REALIZDA COM SUCESSO!'); }
      });
      myExtension.deployPack(uri).then(function (result) {
        const intervalId = setInterval(() => {
          console.log(result);
          if (result === 'resolve') {
            // console.log('UNDEFINED')
            clearInterval(intervalId);
            trash(`${dir}`);
            done();
          }
        }, 3000);
      }).catch((reject) => {
        const intervalId = setInterval(() => {
          if (reject === 1) {
            clearInterval(intervalId);
            trash(`${dir}`);
            fail('Deploy failed');
          }
        }, 3000);
      });
    } catch (error) {
      console.log(error);
      // console.error('Failed to run tests');
    }
  });

  test('Retrieve', (done) => {
    try {
      myExtension.exportPack();
    } catch (error) {
      console.log(error);
    }
  });
});
