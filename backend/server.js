"use strict";
const { app, BrowserWindow, ipcMain, globalShortcut, Tray } = require('electron');
const path = require('path');
const EventEmitter = require('events');
const url = require('url');
const fs = require( 'fs' );
const DEBUG = true;

//const { configIO } = require( "../module/config-io" );

app.commandLine.appendSwitch('remote-debugging-port', '9222');
//let cfg = new configIO( { file: "maruviewer.settings.json" } );
//cfg.addEventListener( "change", ( e ) => { console.log( e.details.old, e.details.new ); } );
//cfg.get().then( r => console.log( r ) );

class WindowManager extends EventEmitter {
	constructor () {
		super();
		this.windows = [];
		const keyboard = { ESC: 0, hidden: false }, SELF = this;

		this.hideAllWindows = function hideAllWindows () {
			if ( keyboard.ESC === 3 ) SELF.windows.forEach( window => { window.hide(); } );
		};
		this.unhideAllWindows = function unhideAllWindows () {
			SELF.windows.forEach( window => window.show() );
		};
		this.toggleAllWindows = function toggleAllWindows () {
			keyboard.ESC++;
			setTimeout( () => keyboard.ESC--, 1000 );
			if ( keyboard.ESC === 3 ) {
				if ( keyboard.hidden ) SELF.unhideAllWindows();
				else SELF.hideAllWindows();
				keyboard.hidden = !keyboard.hidden;
			}
		};

		this.close = function close ( event ) {
			SELF.windows.splice( SELF.windows.indexOf( event.sender ), 1 );
			SELF.emit( "updateTray" );
		}
	}

	main () {
		if ( this.windows.length > 0 ) return;
		let window = new BrowserWindow( { width: 440, height: 715, show: false } );
		this.windows.push( window );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/viewer.html'),
			protocol: "file"
		} ) );
		window.once( "ready-to-show",( SELF => () => { SELF.emit( "updateTray" ); window.show(); } )( this ) );
		window.on( "closed", this.close );
	}
	comic ( { uri } ) {
		let window = new BrowserWindow( { width: 440, height: 680, show: false } );
		this.windows.push( window );
		window.loadURL( uri );
		window.once( "ready-to-show",( SELF => () => { SELF.emit( "updateTray" ); window.show(); } )( this ) );
		window.on( "closed", this.close );
	}
	episode ( { uri } ) {
		let window = new BrowserWindow( { width: 440, height: 680, show: false } );
		this.windows.push( window );
		window.loadURL( uri );
		window.once( "ready-to-show",( SELF => () => { SELF.emit( "updateTray" ); window.show(); } )( this ) );
		window.on( "closed", this.close );
	}
}
function init() {
	let tray;
	const Views = new WindowManager();
	Views.on( "updateTray", () => {
		if ( Views.windows.length ) tray.setToolTip( `MaruViewer is running (${Views.windows.length})` );
	} );
	app.on('ready', () => {
		tray = new Tray( path.join( __dirname, '../resource/icon.png') );
		globalShortcut.register( "ESC", Views.toggleAllWindows );
		tray.setToolTip( `MaruViewer is running (${Views.windows.length})` );
		Views.main();
	} );

	app.on('window-all-closed', () => {
		tray.destroy();
		app.quit();
	});

	app.on('activate', Views.main );

	app.on( 'browser-window-created', ( event, window ) => {
		if ( DEBUG ) window.webContents.openDevTools( { mode: "detach" } );
	} );

	ipcMain.on( "open-comic", ( info, event ) => {
		Views.comic( { uri: event.details.link } );
	} );
}

init();