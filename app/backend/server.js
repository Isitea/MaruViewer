"use strict";
const electron = require('electron');
const path = require('path');
const EventEmitter = require('events');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const { configIO } = require( "../module/config-io" );
const DEBUG = true;
process.env.GH_TOKEN = "9ad7fb4b10b3599c066ccd8dd73b8d84c1e9f1ee";

class WindowManager extends EventEmitter {
	constructor ( defOpt ) {
		super();
		this.windows = [];
		this.defOpt = defOpt;
		const keyboard = { toggleKey: 0, hidden: false }, SELF = this;

		this.toggleAllWindows = function toggleAllWindows () {
			setTimeout( () => keyboard.toggleKey--, 1000 );
			if ( ++keyboard.toggleKey === 3 ) {
				if ( keyboard.hidden ) SELF.unhideAllWindows();
				else SELF.hideAllWindows();
				keyboard.hidden = !keyboard.hidden;
			}
		};
		this.close = function close ( event ) {
			SELF.windows.splice( SELF.windows.indexOf( event.sender ), 1 );
			SELF.emit( "updateTray" );
		};
	}

	unhideAllWindows () {
		this.windows.forEach( window => window.show() );
	}
	hideAllWindows () {
		this.windows.forEach( window => window.hide() );
	}

	main () {
		if ( this.windows.length > 0 ) return;
		let Opt = Object.assign( {}, this.defOpt, true );
		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.setMenu( null );
		window.once( "ready-to-show",( SELF => event => { SELF.emit( "updateTray" ); window.show(); } )( this ) );
		window.on( "closed", this.close );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/viewer.html'),
			protocol: "file"
		} ) );
	}
	comic ( { details } ) {
		let Opt = Object.assign( {}, this.defOpt, true );
		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/episode.html'),
			protocol: "file"
		} ) );
		window.once( "ready-to-show",( ( SELF, details ) => () => {
			SELF.emit( "updateTray" );
			window.webContents.send( "open-comic-link", { details: details } );
			window.show();
		} )( this, details ) );
		window.on( "closed", this.close );
		window.setMenu( null );
	}
	episode ( { uri } ) {
		let Opt = Object.assign( {}, this.defOpt, true );
		delete Opt.minHeight;
		delete Opt.minWidth;
		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/episode.html'),
			protocol: "file"
		} ) );
		window.once( "ready-to-show",( ( SELF, uri ) => () => {
			SELF.emit( "updateTray" );
			window.webContents.send( "open-episode-link", { link: uri } );
			window.show();
		} )( this, uri ) );
		window.on( "closed", this.close );
		window.setMenu( null );
	}
}
class Downloader {
	constructor () {
		function FileRequest( url ) {
			return new Promise( ( resolve, reject ) => {
				let NET = electron.net.request( { url: url } );
				NET.on( "response", response => {
					let contents = Buffer.from( [] );
					response.on( "data", chunk_buffer => contents = Buffer.concat( [ contents, chunk_buffer ] ) );
					response.on( "end", () => resolve( contents ) );
				} );
				NET.on( "error", err => reject( err ) );
				NET.end();
			} );
		}
		function padZ ( n, l ) {
			return ( new Array( l + 1 ).join( '0' ) + n ).slice( -l );
		}
		const fs = require('fs');
		const mkpath = require('mkpath');
		const JSZip = require('jszip');

		this.add = function add ( info ) {
			mkpath.sync( `${info.title}` );
			let zip = new JSZip();
			zip.file( 'Downloaded from.txt', info.downloadFrom );

			let Files = [], index = 0;
			for ( const content of info.Lists )
				Files.push( FileRequest( content.url ).then( ( ( mime, index ) => buffer => zip.file( `${ padZ( index, 3 ) }.${ mime }`, buffer ) )( content.mime.split( '/' ).pop(), index++ ) ) );

			Promise.all( Files )
				.then( () => zip.generateAsync( { type: "nodebuffer" } ) )
				.then( buffer => new Promise( ( resolve, reject ) => {
					fs.open( `${info.title}/${(info.episode ? info.episode : info.title)}.zip`, "w", ( err, fd ) => {
						if ( !err ) {
							fs.write( fd, buffer, ( err, bytesWritten, buffer ) => {
								if ( !err ) resolve( fd );
								else reject( err );
							} );
						}
						else reject( err );
					} )
				} ) )
				.then( fd => fs.close( fd, ( err ) => {
					if ( !err ) this.emit( `Download completed: ${info.title} - ${info.episode}` );
					else throw err;
				} ) )
				.catch( err => console.log( err ) );
		};
	}
}
function init() {
	let tray;

	const Views = new WindowManager( {
		width: 440,
		height: 740,
		show: false,
		minWidth: 320,
		minHeight: 440,
		icon: path.join( __dirname, '../resource/icon.png')
	} );
	Views.on( "updateTray", () => {
		if ( Views.windows.length ) tray.setToolTip( `MaruViewer is running (${Views.windows.length})` );
	} );

	electron.app.on('ready', () => {
		electron.globalShortcut.register( "ESC", Views.toggleAllWindows );

		electron.session.defaultSession.webRequest.onBeforeRequest( {
			urls: [ '*://compass.adop.cc/*', '*://tab2.clickmon.co.kr/*' ]
		}, ( details, response ) => response( { cancel: true } ) );

		Views.main();

		tray = new electron.Tray( path.join( __dirname, '../resource/icon.png') );
		let tray_menu = new electron.Menu();
		tray_menu.append( new electron.MenuItem( {
			label: "Quit",
			role: "quit"
		} ) );
		tray.setContextMenu( tray_menu );
		Views.emit( "updateTray" );
	} );

	electron.app.on('window-all-closed', () => {
		tray.destroy();
		electron.app.quit();
	});

	if ( DEBUG ) {
		electron.app.commandLine.appendSwitch('remote-debugging-port', '9222');
		electron.app.on( 'browser-window-created', ( event, window ) => {
			window.webContents.openDevTools( { mode: "detach" } );
		} );
	}

	electron.ipcMain.on( "open-comic", ( sender, event ) => {
		Views.comic( { details: event.details } );
	} );
	electron.ipcMain.on( "open-episode", ( sender, event ) => {
		Views.episode( { uri: event.details.link } );
	} );

	const downloader = new Downloader();
	electron.ipcMain.on( "request-download", ( sender, event ) => {
		downloader.add( event );
	} );
}

const cfg = new configIO( { file: "maruviewer.settings.json" } );
cfg.addEventListener( "change", ( e ) => { console.log( e.details.old, e.details.new ); } );
cfg.get().then( r => console.log( r ) );

init();
