// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProgressLocation } from 'vscode';
import { Observable, Observer, Subscriber, Subscribable } from 'rxjs';
import { resolve } from 'path';
const util = require('util');
const fs = require('fs');
const trash = require('trash');
const ncp = require('ncp').ncp;
const homedir = require('os').homedir();
const workingwithpath = require('path');
const exec = util.promisify(require('child_process').exec);
const { spawn } = require('child_process');
const outputChannel = vscode.window.createOutputChannel("SFCI");
const NO_DEFAUL_ORG = "no_default_org";
const readFilePromise = util.promisify(fs.readFile);
var extractzip = require('extract-zip');
var showNotification = true;


async function exportPack() {
	showProgressNotification("SFCI: Exporting metadata");
	let wspaces = vscode.workspace.workspaceFolders;
	outputChannel.show();
	try {
		if (wspaces){
			let _home =  workingwithpath.resolve(`${homedir}/.sfci/metadata`);
			let _packpath = workingwithpath.normalize(`${_home}/package.xml`);
			let _zippath = workingwithpath.normalize(`${_home}/unpackaged.zip`);		
			let _sfdxpath = workingwithpath.normalize(`${wspaces[0].uri.fsPath}/manifest/package.xml`);
			let _sfdxmeta = workingwithpath.normalize(`${wspaces[0].uri.fsPath}/metadata`);
			let _defaultOrg = await getDefaultOrg(workingwithpath.normalize(`${wspaces[0].uri.fsPath}`));
			const {stdout} = await exec(`sfdx force:mdapi:retrieve -k "${_sfdxpath}" -r "${_home}" -u ${_defaultOrg} -s`);
			await extractzip(`${_zippath}`,{ dir:`${_home}`});
			await fs.unlinkSync(`${_packpath}`);
			await fs.unlinkSync(`${_zippath}`);
			await ncp(`${_home}`,`${_sfdxmeta}`);
			await trash(`${_home}`);
			outputChannel.append(stdout);
		}
	} catch (error) {
		 vscode.window.showInformationMessage('SFCI: Error during metadata exporting process');
		outputChannel.append(error);
		showNotification=false;
	}		
	//observable.next
	vscode.window.showInformationMessage('SFCI: Metadata exported');
	showNotification=false;
}
async function deployPack(uri:vscode.Uri) {
	showProgressNotification("SFCI: Deploying metadata");
	let wspaces = vscode.workspace.workspaceFolders;
	outputChannel.show();
	try {
		if (wspaces){
			let _metadatapath = workingwithpath.normalize(`${uri.fsPath}/../`);
			let _defaultOrg = await getDefaultOrg(workingwithpath.normalize(`${wspaces[0].uri.fsPath}`));
			const child = spawn(`sfdx`, [`force:mdapi:deploy`,
			 `-d`,  `"${_metadatapath}"`,
			`-u` ,  `${_defaultOrg}`, `-l`, `NoTestRun`,
			`-w`, `100`], {shell: true});
			child.stdout.on('data', (data:any) => {
				outputChannel.append(`${data}`);
				console.log(`child stdout:\n${data}`);
			  });
			  child.stderr.on('data', (data:any) => {
				outputChannel.append(`${data}`);
				console.error(`${data}`);
			  });
		}
	} catch (error) {
		vscode.window.showInformationMessage('SFCI: Error during metadata deploy');
		//outputChannel.append(error);
		showNotification=false;
	}		
	//observable.next
	// vscode.window.showInformationMessage('SFCI: Metadata exported');
	
	showNotification=false;
	
}
async function getDefaultOrg (rootFolder: string) {
	let userOrorg = `${NO_DEFAUL_ORG}`;

	try {
		let dxOrgFile = workingwithpath.normalize(`${rootFolder}/.sfdx/sfdx-config.json`)
		if(fs.existsSync(`${dxOrgFile}`)){
			let filedata = await readFilePromise(`${dxOrgFile}`);
			userOrorg = JSON.parse(filedata).defaultusername;
			return `${userOrorg}`;
		}else{
			outputChannel.append("SFCI: Please, configure a dafult org");
			throw new Error("SFCI: There is no default org");
		}
	} catch (error) {
		console.log(error);
		throw error;
	}	
}
function subscribe(subscriber:any){
	const intervalId = setInterval(() => {
		if (!showNotification){
			showNotification=true;
			clearInterval(intervalId);
			subscriber.complete();
		}
	
	}, 1000);
	
}
  
function showProgressNotification(message:string){
	vscode.window.withProgress({
		location: ProgressLocation.Notification,
		title: message,
		cancellable: true
	}, (progress, token) => {
		const p = new Promise(resolve => {
			token.onCancellationRequested(() => {
				console.log("User canceled the long running operation");
			});
			
			subscribe({complete() {
				progress.report({ increment: 100 });
				resolve()}}
			);
			
			
			// if (observable) {
			// 	observable.subscribe({
			// 	  complete() {
			// 		progress.report({ increment: 100 });
			// 		resolve();
			// 	  }
			// 	});
			//   }
		});
		return p;
	});
}


	
//   async function Createterminal() {
// 	  term.sendText("OI!!!!!!!");
// 	// vscode.window.onDidOpenTerminal;
//   	// vscode.window.onDidChangeActiveTerminal(eve)
//   }
  

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let contextMenuExp = vscode.commands.registerCommand('sfci.classic.package.export', () => {
		exportPack();
	});
	let contextMenuDeploy = vscode.commands.registerCommand('sfci.classic.package.deploy', (uri:vscode.Uri) => {
		deployPack(uri);
	});

	context.subscriptions.push(contextMenuExp,contextMenuDeploy);
}
// function registerCommands(
// 	extensionContext: vscode.ExtensionContext
//   ): vscode.Disposable {

// 	const forceSourceRetrieveInManifestCmd = vscode.commands.registerCommand(
// 	  'sfdx.force.mdapi.retrieve.in.manifest',
// 	  	"deejjoj"
// 	);
  
// 	return vscode.Disposable.from(
// 	  forceSourceRetrieveInManifestCmd
// 	);
//   }
// function sendText(textToSend: string): void{
// 	if (ensureTerminalExists()) {
// 		selectTerminal().then(terminal => {
// 			if (terminal) {
// 				vscode.window.createTerminal(`Ext Terminal #1`, '/bin/zsh', ['-l']);
// 				terminal.sendText(textToSend);
// 			}
// 		});
// 	}
// }

// function selectTerminal(): Thenable<vscode.Terminal | undefined> {
// 	interface TerminalQuickPickItem extends vscode.QuickPickItem {
// 		terminal: vscode.Terminal;
// 	}
// 	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
// 	const items: TerminalQuickPickItem[] = terminals.map(t => {
// 		return {
// 			label: `name: ${t.name}`,
// 			terminal: t
// 		};
// 	});
// 	return vscode.window.showQuickPick(items).then(item => {
// 		return item ? item.terminal : undefined;
// 	});
// }

// function ensureTerminalExists(): boolean {
// 	if ((<any>vscode.window).terminals.length === 0) {
// 		vscode.window.showErrorMessage('No active terminals');
// 		return false;
// 	}
// 	return true;
// }
  
// this method is called when your extension is deactivated
export function deactivate() {}
