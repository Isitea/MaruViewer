"use strict";
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const fs = require( 'fs' );
const DEBUG = true;

const { configIO } = require( "../module/config-io" );
let cfg = new configIO( { file: "maruviewer.settings.json" } );
cfg.addEventListener( "change", ( e ) => { console.log( e.details.old, e.details.new ); } );
cfg.get().then( r => console.log( r ) );

let windows = [];
function createWindow ( { uri: uri, protocol: protocol } = { uri: path.join(__dirname, '../frontend/viewer.html'), protocol: 'file:' } ) {
	windows.push( new BrowserWindow({width: 800, height: 600}) );
	let cWin = windows[windows.length - 1];
	cWin.loadURL(url.format({
		pathname: uri,
		protocol: protocol,
		slashes: true
	}));
	cWin.on('closed', () => {
		windows.splice( windows.indexOf( cWin ), 1 );
	});
}

app.on('ready', () => {
	createWindow();
} );

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (windows.length === 0) {
		createWindow()
	}
});

app.on( 'browser-window-created', ( event, window ) => {
	if ( DEBUG ) window.webContents.openDevTools( { mode: "detach" } );
} );
app.commandLine.appendSwitch('remote-debugging-port', '9222');
