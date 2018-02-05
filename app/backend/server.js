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
		function closed ( event ) {
			SELF.windows.splice( SELF.windows.indexOf( event.sender ), 1 );
			SELF.emit( "updateTray" );
		}

		super();
		this.defOpt = defOpt;
		const SELF = this;

		electron.app.on( 'browser-window-created', ( event, window ) => {
			SELF.emit( "updateTray" );
			window.once( "ready-to-show", event => event.sender.show() );
			window.on( "closed", closed );
		} );
	}

	initialize () {
		this.windows = [];
	}

	unhideAllWindows () {
		this.windows.forEach( window => window.show() );
	}
	hideAllWindows () {
		this.windows.forEach( window => window.hide() );
	}

	main () {
		if ( this.windows.length > 0 ) return;

		let Opt = configIO.merge( {}, this.defOpt );
		if ( Opt.width < Opt.minWidth ) Opt.width = Opt.minWidth;
		if ( Opt.height < Opt.minHeight ) Opt.height = Opt.minHeight;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = "main";
		window.setMenu( null );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/viewer.html'),
			protocol: "file"
		} ) );
	}
	comic ( { details } ) {
		let Opt = configIO.merge( {}, this.defOpt );
		if ( Opt.width < Opt.minWidth ) Opt.width = Opt.minWidth;
		if ( Opt.height < Opt.minHeight ) Opt.height = Opt.minHeight;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = "comic";
		window.once( "ready-to-show",( ( details ) => () => {
			window.webContents.send( "open-comic-link", { details: details } );
		} )( details ) );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/episode.html'),
			protocol: "file"
		} ) );
		window.setMenu( null );
	}
	episode ( { uri } ) {
		let Opt = configIO.merge( {}, this.defOpt );
		delete Opt.minHeight;
		delete Opt.minWidth;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = "episode";
		window.once( "ready-to-show",( ( uri ) => () => {
			window.webContents.send( "open-episode-link", { link: uri } );
		} )( uri ) );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/episode.html'),
			protocol: "file"
		} ) );
		window.setMenu( null );
	}
}
class DownloadManager {
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
class ShortcutManager {
	constructor () {

	}
	
	initialize ( Views ) {
		this.counter = { toggleKey: 0, hidden: false };
		this.Views = Views;
	}

	listen () {
		electron.globalShortcut.register( "ESC", ( SELF => {
			setTimeout( () => SELF.counter.toggleKey--, 1000 );
			if ( ++SELF.counter.toggleKey === 3 ) {
				if ( SELF.counter.hidden ) SELF.Views.unhideAllWindows();
				else SELF.Views.hideAllWindows();
				SELF.counter.hidden = !SELF.counter.hidden;
			}
		} ) ( this ) );
	}
}
class TrayManager {
	constructor () {
		
	}
	
	initialize () {
		this.Tray = new electron.Tray( path.join( __dirname, '../resource/icon.png') );
		let tray_menu = new electron.Menu();
		tray_menu.append( new electron.MenuItem( {
			label: "Quit",
			role: "quit"
		} ) );
		this.Tray.setContextMenu( tray_menu );
	}
	
	listen ( Views ) {
		Views.on( "updateTray", () => {
			if ( Views.windows.length ) this.Tray.setToolTip( `MaruViewer is running (${Views.windows.length})` );
		} );
	}
}
class NetworkManager {
	constructor () {

	}

	initialize () {

	}

	listen () {
		electron.session.defaultSession.webRequest.onBeforeRequest( {
			urls: [ '*://compass.adop.cc/*', '*://tab2.clickmon.co.kr/*' ]
		}, ( details, response ) => response( { cancel: true } ) );
	}
}
class CommunicationManager {
	constructor () {

	}
	initialize ( { Views, Downloader } ) {
		this.Views = Views;
		this.Downloader = Downloader;
	}

	listen () {
		electron.ipcMain.on( "open-comic", ( SELF => ( sender, event ) => {
			SELF.Views.comic( { details: event.details } );
		} )( this ) );
		electron.ipcMain.on( "open-episode", ( SELF => ( sender, event ) => {
			SELF.Views.comic( { uri: event.details.link } );
		} )( this ) );

		electron.ipcMain.on( "request-download", ( SELF => ( sender, event ) => {
			SELF.Downloader.add( event );
		} )( this ) );
	}
}
class NotificationManager {
	constructor () {

	}

	initialize ( { icon, Views } ) {
		this.icon = icon;
		this.Views = Views;
	}

	notify ( { title, body, uri } ) {
		let item = new electron.Notification( { title, body, icon: this.icon } );
		if ( uri ) item.once( "click", ( ( SELF, uri ) => event => SELF.Views.episode( { uri } ) )( this, uri ) );
		item.show();
	}
}
function init() {
	const config = new configIO( { file: "maruviewer.settings.json", writeOnChange: true } );
	const settings = {};
	config.addEventListener( "change", ( e ) => { console.log( e.details ); config.options.then( json => configIO.merge( settings, json, true ) ); } );

	let tray;

	const Views = new WindowManager( {
		width: 440,
		height: 740,
		show: false,
		minWidth: 320,
		minHeight: 440,
		icon: path.join( __dirname, '../resource/icon.png')
	} );
	const Tray = new TrayManager();
	const Shortcut = new ShortcutManager();
	const Network = new NetworkManager();
	const Communicator = new CommunicationManager();
	const Downloader = new DownloadManager();
	const Notifier = new NotificationManager();

	electron.app.on( 'ready', event => config.options.then( json => {
		configIO.merge( settings, json, true );

		Views.initialize();
		Tray.initialize();
		Tray.listen( Views );
		Shortcut.initialize( Views );
		Shortcut.listen();
		Network.initialize();
		Network.listen();
		Communicator.initialize( { Views, Downloader } );
		Communicator.listen();
		Notifier.initialize( { Views, icon: path.join( __dirname, '../resource/icon.png') } )

		electron.app.on( 'browser-window-created', ( event, window ) => {
			window.on( "resize", event => {
				let window = event.sender;
				if ( config[window.actionType].resize ) {
					config.set = { [window.actionType]: { width: window.width, height: window.height } }
				}
			} );
			window.on( "move", event => {
				let window = event.sender;
				if ( config[window.actionType].move ) {
					config.set = { [window.actionType]: { x: window.x, y: window.y } }
				}
			} );
		} );

		Views.main();
	} ) );

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

}

init();
