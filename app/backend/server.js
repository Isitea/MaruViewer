"use strict";
const electron = require('electron');
const path = require('path');
const EventEmitter = require('events');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const { configIO } = require( "../module/config-io" );
const DEBUG = false;
process.env.GH_TOKEN = "9ad7fb4b10b3599c066ccd8dd73b8d84c1e9f1ee";

class WindowManager extends EventEmitter {
	constructor ( settings ) {
		function closed ( event ) {
			SELF.windows.splice( SELF.windows.indexOf( event.sender ), 1 );
			if ( SELF.windows.length > 0 ) SELF.emit( "updateTray" );
			else electron.app.emit( 'window-all-closed' );
		}

		super();
		this.settings = settings;
		const SELF = this;

		electron.app.on( 'browser-window-created', ( event, window ) => {
			process.nextTick( ( ( { window } ) => () => {
				if ( SELF.windows.indexOf( window ) !== -1 ) {
					SELF.emit( "updateTray" );
					window.once( "ready-to-show", event => event.sender.show() );
					window.on( "closed", closed );
				} else {
					window.on( "hide", event => event.sender.close() );
				}
			} )( { window } ) );
		} );
	}

	initialize ( defOpt ) {
		this.defOpt = defOpt;
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

		let Opt = configIO.merge( {}, this.defOpt ), actionType = "main";
		if ( this.settings.resize && ( this.settings[actionType] && this.settings[actionType].width && this.settings[actionType].height ) ) {
			Opt.width = this.settings[actionType].width;
			Opt.height = this.settings[actionType].height;
		}
		if ( this.settings.move && ( this.settings[actionType] && this.settings[actionType].x && this.settings[actionType].y ) ) {
			Opt.x = this.settings[actionType].x;
			Opt.y = this.settings[actionType].y;
		}
		if ( Opt.width < Opt.minWidth ) Opt.width = Opt.minWidth;
		if ( Opt.height < Opt.minHeight ) Opt.height = Opt.minHeight;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = actionType;
		window.setMenu( null );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/viewer.html'),
			protocol: "file"
		} ) );
	}
	comic ( { details } ) {
		let Opt = configIO.merge( {}, this.defOpt ), actionType = "comic";
		if ( this.settings.resize && ( this.settings[actionType] && this.settings[actionType].width && this.settings[actionType].height ) ) {
			Opt.width = this.settings[actionType].width;
			Opt.height = this.settings[actionType].height;
		}
		if ( this.settings.move && ( this.settings[actionType] && this.settings[actionType].x && this.settings[actionType].y ) ) {
			Opt.x = this.settings[actionType].x;
			Opt.y = this.settings[actionType].y;
		}
		if ( Opt.width < Opt.minWidth ) Opt.width = Opt.minWidth;
		if ( Opt.height < Opt.minHeight ) Opt.height = Opt.minHeight;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = actionType;
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
		let Opt = configIO.merge( {}, this.defOpt ), actionType = "episode";
		if ( this.settings.resize && ( this.settings[actionType] && this.settings[actionType].width && this.settings[actionType].height ) ) {
			Opt.width = this.settings[actionType].width;
			Opt.height = this.settings[actionType].height;
		}
		if ( this.settings.move && ( this.settings[actionType] && this.settings[actionType].x && this.settings[actionType].y ) ) {
			Opt.x = this.settings[actionType].x;
			Opt.y = this.settings[actionType].y;
		}
		delete Opt.minHeight;
		delete Opt.minWidth;

		let window = new electron.BrowserWindow( Opt );
		this.windows.push( window );
		window.actionType = actionType;
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
	constructor ( settings ) {
		this.settings = settings;
	}

	initialize ( { Notifier } ) {
		this.Notifier = Notifier;
	}

	listen () {
		this.download = ( ( SELF ) => {
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
			const settings = this.settings;

			return ( info ) => {
				mkpath.sync( `${info.path}` );
				let zip = new JSZip();
				zip.file( 'Downloaded from.txt', info.downloadFrom );

				let Files = [], index = 0;
				for ( const content of info.Lists )
					Files.push( FileRequest( content.url ).then( ( ( mime, index ) => buffer => zip.file( `${ padZ( index, 3 ) }.${ mime }`, buffer ) )( content.mime.split( '/' ).pop(), index++ ) ) );

				Promise.all( Files )
					.catch( err => { throw { title: "Error on downloading", body: `Fail to download some images in [ ${info.title} - ${info.episode} ]` } } )
					.then( () => zip.generateAsync( { type: "nodebuffer" } ) )
					.then( buffer => new Promise( ( resolve, reject ) => {
						fs.open( `${info.path}/${(info.episode ? info.episode : info.title)}.zip`, "w", ( err, fd ) => {
							if ( !err ) {
								fs.write( fd, buffer, ( err, bytesWritten, buffer ) => {
									if ( !err ) resolve( fd );
									else reject( { title: "Filesystem error", body: `Can't write a file: ${info.path}/${(info.episode ? info.episode : info.title)}.zip` } );
								} );
							}
							else reject( { title: "Filesystem error", body: `Can't open a file: ${info.path}/${(info.episode ? info.episode : info.title)}.zip` } );
						} )
					} ) )
					.then( fd => fs.close( fd, ( err ) => {
						if ( !err ) SELF.notify( { title: "Download completed", body: `Successfully downloaded: ${info.title} - ${info.episode}`, path : `${info.path}/${(info.episode ? info.episode : info.title)}.zip` } );
						//else throw { title: "Undefined error", body: `Something goes wrong: ${err}` };
						else throw { title: "Filesystem error", body: `Can't close a file: ${info.path}/${(info.episode ? info.episode : info.title)}.zip` };
					} ) )
					.catch( message => SELF.notify( message ) );
			};
		} )( this );
	}

	notify ( message ) {
		this.Notifier.notify( message );
	}
}
class ShortcutManager {
	constructor ( settings ) {
		this.settings = settings;
	}
	
	initialize ( { Views } ) {
		this.counter = { toggleKey: 0, hidden: false };
		this.Views = Views;
	}

	listen () {
		electron.globalShortcut.register( "ESC", ( SELF => () => {
			setTimeout( ( SELF => () => SELF.counter.toggleKey-- )( SELF ), 1000 );
			if ( ++SELF.counter.toggleKey === 3 ) {
				if ( SELF.counter.hidden ) SELF.Views.unhideAllWindows();
				else SELF.Views.hideAllWindows();
				SELF.counter.hidden = !SELF.counter.hidden;
			}
		} ) ( this ) );
	}

	close () {
		electron.globalShortcut.unregisterAll();
	}
}
class TrayManager {
	constructor ( settings ) {
		this.settings = settings;
	}
	
	initialize ( { Views } ) {
		this.Views = Views;
		this.Tray = new electron.Tray( path.join( __dirname, '../resource/icon.png') );
		let tray_menu = new electron.Menu();
		tray_menu.append( new electron.MenuItem( {
			label: "Quit",
			role: "quit"
		} ) );
		this.Tray.setContextMenu( tray_menu );
	}
	
	listen () {
		this.Views.on( "updateTray",( SELF => () => {
			if ( SELF.Views.windows.length ) this.Tray.setToolTip( `MaruViewer is running (${SELF.Views.windows.length})` );
		} )( this ) );
	}
	close () {
		this.Tray.destroy();
	}
}
class NetworkManager {
	constructor ( settings ) {
		this.settings = settings;
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
	constructor ( settings ) {
		this.settings = settings;
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
			SELF.Views.episode( { uri: event.details.link } );
		} )( this ) );

		electron.ipcMain.on( "request-download", ( SELF => ( sender, event ) => {
			if ( SELF.settings.path && SELF.settings.path.length > 0 ) event.path = SELF.settings.path + '/' + event.title;
			else event.path = event.title;
			SELF.Downloader.download( event );
		} )( this ) );
	}

	close () {
		electron.ipcMain.removeAllListeners( "open-comic" );
		electron.ipcMain.removeAllListeners( "open-episode" );
		electron.ipcMain.removeAllListeners( "request-download" );
	}
}
class NotificationManager {
	constructor ( settings ) {
		this.settings = settings;
	}

	initialize ( { icon, Views } ) {
		this.notification = require( "electron-notify" );
		this.notification.setConfig({
			appIcon: icon,
			displayTime: 13000
		});
		this.active = false;
		this.Views = Views;
	}

	notify ( { title, body, uri, path } ) {
		if ( !this.active ) return false;
		new Promise( ( resolve, reject ) => {
			this.notification.notify( {
				title,
				text: body,
				onClickFunc: ( ( { uri, path } ) => event => { resolve( { uri, path } ); event.closeNotification();  } )( { uri, path } ),
				onCloseFunc: () => resolve( {} )
			} );
		} )
			.then( ( { uri, path } ) => {
				if ( uri ) this.Views.episode( { uri } );
				if ( path ) electron.shell.showItemInFolder( path );
		} ).catch( err => console.log( err ) );
	}

	listen () {
		this.active = true;
	}

	close () {
		try {
			this.notification.closeAll();
		} catch ( e ) { console.log( e ); }
	}
}
class MaruObserver {
	constructor ( settings ) {
		this.settings = settings
	}

	initialize ( { Notifier } ) {
		this.Notifier = Notifier;
	}

	listen () {
		if ( this.observer ) return;
		this.observer = new electron.BrowserWindow( { show: false } );
		this.observer.loadURL( url.format( {
			pathname: path.join( __dirname, 'MaruObserver.html' ),
			protocol: "file"
		} ) );

		electron.ipcMain.on( "maru-updated", ( SELF => ( sender, message ) => {
			for ( const item of message )
				SELF.Notifier.notify( { title: "Comic updated", body: item.title, uri: item.link } );
		} )( this ) );

	}

	close () {
		if ( this.observer ) {
			this.observer.close();
			delete this.observer;
		}
		electron.ipcMain.removeAllListeners( "maru-updated" );
	}
}
function init() {
	const config = new configIO( { file: "maruviewer.settings.json", writeOnChange: true } );
	const settings = {};
	config.initialize( {
		resize: true,
		move: true,
		shortcut: true,
		updateChecker: false,
		notification: true
	} );
	//config.addEventListener( "change", ( e ) => { console.log( e.details ); } );
	config.options.then( json => configIO.merge( settings, json, true ) );

	const Views = new WindowManager(  settings  );
	const Tray = new TrayManager( settings );
	const Shortcut = new ShortcutManager( settings );
	const Network = new NetworkManager( settings );
	const Communicator = new CommunicationManager( settings );
	const Downloader = new DownloadManager( settings );
	const Notifier = new NotificationManager( settings );
	const Observer = new MaruObserver( settings );

	electron.app.on( 'ready', event => config.options.then( json => {
		configIO.merge( settings, json, true );

		Views.initialize( {
			width: 440,
			height: 740,
			show: false,
			minWidth: 320,
			minHeight: 440,
			icon: path.join( __dirname, '../resource/icon.png')
		} );
		Tray.initialize( { Views } );
		Tray.listen();
		Shortcut.initialize( { Views } );
		if ( settings.shortcut ) Shortcut.listen();
		Network.initialize();
		Network.listen();
		Communicator.initialize( { Views, Downloader } );
		Communicator.listen();
		Downloader.initialize( { Notifier } );
		Downloader.listen();
		Notifier.initialize( { Views, icon: path.join( __dirname, '../resource/icon.png') } );
		if ( settings.notification ) Notifier.listen();
		Observer.initialize( { Notifier } );
		if ( settings.updateChecker ) Observer.listen();

		electron.app.on( 'browser-window-created', ( event, window ) => {
			window.on( "resize", event => {
				let window = event.sender;
				if ( window.actionType && settings.resize ) {
					let [ width, height ] = window.getSize();
					config.set( configIO.merge( { [window.actionType]: settings[window.actionType] }, { [window.actionType]: {  width, height } } ) );
				}
			} );
			window.on( "move", event => {
				let window = event.sender;
				if ( window.actionType && settings.move ) {
					let [ x, y ] = window.getPosition();
					config.set( configIO.merge( { [window.actionType]: settings[window.actionType] }, { [window.actionType]: { x, y } } ) );
				}
			} );
		} );

		Views.main();
		autoUpdater.checkForUpdatesAndNotify();
	} ).catch( e => console.log( e ) ) );

	electron.app.on('window-all-closed', () => {
		Shortcut.close();
		Observer.close();
		Notifier.close();
		Tray.close();
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
