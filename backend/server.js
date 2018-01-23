"use strict";
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const DEBUG = true;


let win;
function createWindow ( { uri: uri, protocol: protocol } = { uri: path.join(__dirname, '../frontend/viewer.html'), protocol: 'file:' } ) {
	win = new BrowserWindow({width: 800, height: 600});
	win.loadURL(url.format({
		pathname: uri,
		protocol: protocol,
		slashes: true
	}));
	win.on('closed', () => {
		win = null;
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
	if (win === null) {
		createWindow()
	}
});

app.on( 'browser-window-created', ( event, window ) => {
	if ( DEBUG ) window.webContents.openDevTools( { mode: "detach" } );
} );
app.commandLine.appendSwitch('remote-debugging-port', '9222');
