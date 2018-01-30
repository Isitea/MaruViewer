"use strict";
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require( 'fs' );
const DEBUG = true;

const { configIO } = require( "../module/config-io" );

app.commandLine.appendSwitch('remote-debugging-port', '9222');

let cfg = new configIO( { file: "maruviewer.settings.json" } );
cfg.addEventListener( "change", ( e ) => { console.log( e.details.old, e.details.new ); } );
cfg.get().then( r => console.log( r ) );

let windows = [];
function main () {
	let window = new BrowserWindow( { width: 440, height: 715 } );
	window.loadURL( url.format( {
		pathname: path.join( __dirname, '../frontend/viewer.html'),
		protocol: "file"
	} ) );
	window.on( "closed", ( event ) => {
		windows.splice( windows.indexOf( event.sender ), 1 );

	} );
}
function comic ( { uri } ) {
	let window = new BrowserWindow( { width: 440, height: 680 } );
	window.loadURL( uri );
	window.on( "closed", ( event ) => {
		windows.splice( windows.indexOf( event.sender ), 1 );
	} );
}
function episode ( { uri } ) {
	let window = new BrowserWindow( { width: 440, height: 680 } );
	window.loadURL( uri );
	window.on( "closed", ( event ) => {
		windows.splice( windows.indexOf( event.sender ), 1 );
	} );
}

app.on('ready', () => {
	main();
} );

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate', () => {
	if (windows.length === 0) {
		main();
	}
});

app.on( 'browser-window-created', ( event, window ) => {
	if ( DEBUG ) window.webContents.openDevTools( { mode: "detach" } );
} );

ipcMain.on( "open-comic", ( info, event ) => {
	comic( { uri: event.details.link } );
} );