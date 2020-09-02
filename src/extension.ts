/* eslint-disable no-useless-escape */
/* eslint-disable semi */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { ProgressLocation } from 'vscode';
import * as oldfs from 'fs';
const util = require('util');
const fs = require('fs');
const trash = require('trash');
const ncp = require('ncp').ncp;
const homedir = require('os').homedir();
const workingwithpath = require('path');
const exec = util.promisify(require('child_process').exec);
const { spawn } = require('child_process');
const outputChannel = vscode.window.createOutputChannel('SFCI');
const NO_DEFAUL_ORG = 'no_default_org';
const readFilePromise = util.promisify(fs.readFile);
const extractzip = require('extract-zip');
const _homeSfciDeploy = workingwithpath.normalize(`${homedir}/.sfci/tmp/deploy`);
let showNotification = true;

export async function exportPack () {
  showProgressNotification('SFCI: Exporting metadata');
  const wspaces = vscode.workspace.workspaceFolders;
  outputChannel.show();
  try {
    if (wspaces) {
      const _home = workingwithpath.resolve(`${homedir}/.sfci/metadata`);
      const _packpath = workingwithpath.normalize(`${_home}/package.xml`);
      const _zippath = workingwithpath.normalize(`${_home}/unpackaged.zip`);
      const _sfdxpath = workingwithpath.normalize(`${wspaces[0].uri.fsPath}/manifest/package.xml`);
      const _sfdxmeta = workingwithpath.normalize(`${wspaces[0].uri.fsPath}/metadata`);
      const _defaultOrg = await getDefaultOrg(workingwithpath.normalize(`${wspaces[0].uri.fsPath}`));
      const { stdout } = await exec(`sfdx force:mdapi:retrieve -k "${_sfdxpath}" -r "${_home}" -u ${_defaultOrg} -s`);
      await extractzip(`${_zippath}`, { dir: `${_home}` });
      await fs.unlinkSync(`${_packpath}`);
      await fs.unlinkSync(`${_zippath}`);
      await ncp(`${_home}`, `${_sfdxmeta}`);
      await trash(`${_home}`);
      outputChannel.append(stdout);
    }
  } catch (error) {
    vscode.window.showInformationMessage('SFCI: Error during metadata exporting process');
    outputChannel.append(error);
    showNotification = false;
  }
  // observable.next
  vscode.window.showInformationMessage('SFCI: Metadata exported');
  showNotification = false;
}
export async function deployPack (uri:vscode.Uri) {
  showProgressNotification('SFCI: Deploying metadata');
  const wspaces = getRootPath();
  outputChannel.show();
  outputChannel.append('Starting deploy .... it can get some time ;)\n');
  try {
    await isAccessible(_homeSfciDeploy).catch(async (reject) => {
      await trash(`${_homeSfciDeploy}`);
    });
    const _defaultOrg = await getDefaultOrg(workingwithpath.normalize(`${wspaces.fsPath}`));
    const _metadatapath = workingwithpath.normalize(`${uri.fsPath}/../`);
    await fs.mkdir(_homeSfciDeploy, { recursive: true }, (err:any) => { if (err) throw err; });
    await ncp(`${_metadatapath}`, `${_homeSfciDeploy}`);
    return new Promise(function (resolve, reject) {
      const child = spawn('sfdx', ['force:mdapi:deploy', '-d', `${_homeSfciDeploy}`, '-u', `${_defaultOrg}`, '-l', 'NoTestRun', '-w', '-1'], { shell: true, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      child.stdout.on('data', (data:any) => {
        outputChannel.append(`${data}`);
        console.log(`child stdout:\n${data}`);
      });
      child.stderr.on('data', (data:any) => {
        outputChannel.append(`${data}`);
        console.log(`${data}`);
        // throw new Error('error')
      });
      child.on('close', (code:any) => {
        if (code !== 0) {
          console.log(`sfdx process exited with code ${code}`);
          reject(code);
        } else {
          trash(`${_homeSfciDeploy}`);
          console.log('deploy: acao concluida com sucesso');
          outputChannel.append('Deployed');
          resolve('resolve');
        }
      });
    });
  } catch (error) {
    vscode.window.showInformationMessage('SFCI: Error during metadata deploy');
    showNotification = false;
    console.error(`${error}`);
    trash(`${_homeSfciDeploy}`);
    return Promise.reject(error);
  } finally {
    showNotification = false;
  }
}

async function isAccessible (dir:any) {
  try {
    await fs.access(dir, oldfs.constants.F_OK | oldfs.constants.W_OK | oldfs.constants.R_OK);
  } catch (error) {
    console.log(`${dir} is not exists / writable / readable`);
    return Promise.reject(error);
  }
  return Promise.resolve('resolve');
}

function getRootPath ():vscode.Uri {
  const rPath = vscode.workspace.workspaceFolders;
  if (rPath) {
    return rPath[0].uri;
  } else {
    return vscode.Uri.parse(workingwithpath.normalize(`${__dirname}/../`));
  }
}
async function getDefaultOrg (rootFolder: string) {
  let userOrorg = `${NO_DEFAUL_ORG}`;

  try {
    const dxOrgFile = workingwithpath.normalize(`${rootFolder}/.sfdx/sfdx-config.json`);
    if (fs.existsSync(`${dxOrgFile}`)) {
      const filedata = await readFilePromise(`${dxOrgFile}`);
      userOrorg = JSON.parse(filedata).defaultusername;
      return `${userOrorg}`;
    } else {
      outputChannel.append('SFCI: Please, configure a dafult org');
      throw new Error('SFCI: There is no default org');
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
function subscribe (subscriber:any) {
  const intervalId = setInterval(() => {
    if (!showNotification) {
      showNotification = true;
      clearInterval(intervalId);
      subscriber.complete();
    }
  }, 1000);
}

function showProgressNotification (message:string) {
  vscode.window.withProgress({
    location: ProgressLocation.Notification,
    title: message,
    // eslint-disable-next-line comma-dangle
    cancellable: true
  }, (progress, token) => {
    const p = new Promise((resolve) => {
      token.onCancellationRequested(() => {
        console.log('User canceled the long running operation');
      });

      subscribe({
        complete () {
          progress.report({ increment: 100 });
          resolve();
        // eslint-disable-next-line comma-dangle
        }
      }
      );
    });
    return p;
  });
}

export function activate (context: vscode.ExtensionContext) {
  const contextMenuExp = vscode.commands.registerCommand('sfci.classic.package.export', () => {
    exportPack();
  });
  const contextMenuDeploy = vscode.commands.registerCommand('sfci.classic.package.deploy', (uri:vscode.Uri) => {
    deployPack(uri);
  });

  context.subscriptions.push(contextMenuExp, contextMenuDeploy);
}

// this method is called when your extension is deactivated
export function deactivate () {}
