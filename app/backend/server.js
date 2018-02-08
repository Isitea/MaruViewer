"use strict";
const electron = require('electron');
if ( require( 'electron-squirrel-startup' ) ) {
	electron.app.quit();
	return;
}
const path = require('path');
const EventEmitter = require('events');
const url = require('url');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const { configIO } = require( "../module/config-io" );
const DEBUG = false;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

class WindowManager extends EventEmitter {
	constructor ( { settings } ) {
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
				if ( SELF.windows.indexOf( window ) > -1 ) {
					SELF.emit( "updateTray" );
					window.once( "ready-to-show", event => event.sender.show() );
					window.on( "closed", closed );
				}
			} )( { window } ) );
		} );
	}

	initialize ( { defOpt, Observer } ) {
		this.defOpt = defOpt;
		this.Observer = Observer;
		this.windows = [];
	}

	unhideAllWindows () {
		this.windows.forEach( window => window.show() );
	}
	hideAllWindows () {
		this.windows.forEach( window => window.hide() );
	}

	static findAndShow ( actionType ) {
		let flag = false;
		for ( const window of this.windows ) {
			if ( window.actionType === actionType ) {
				window.show();
				flag = true;
			}
		}

		return flag;
	}
	static findAndAction ( actionType, Action ) {
		let flag = false;
		for ( const window of this.windows ) {
			if ( window.actionType === actionType ) {
				Action( window );
				flag = true;
			}
		}

		return flag;
	}

	main () {
		let Opt = configIO.merge( {}, this.defOpt ), actionType = "main";
		if ( this.constructor.findAndShow.call( this, actionType ) ) return;

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
		if ( this.constructor.findAndShow.call( this, actionType ) ) {}
		if ( !details ) return;

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
		window.once( "ready-to-show",( details => () => {
			window.webContents.send( "open-comic-link", { details } );
		} )( details ) );
		window.loadURL( url.format( {
			pathname: path.join( __dirname, '../frontend/episode.html'),
			protocol: "file"
		} ) );
		window.setMenu( null );
	}
	episode ( { uri } ) {
		let Opt = configIO.merge( {}, this.defOpt ), actionType = "episode";
		if ( this.constructor.findAndShow.call( this, actionType ) ) {}
		if ( !uri ) return;
		else this.Observer.clear( uri );

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
	configuration () {
		if ( this.config ) {
			this.config.show();
		} else {
			this.config = new electron.BrowserWindow( {
				width: 320,
				height: 330,
				minWidth: 320,
				minHeight: 330,
				resizable: false,
				alwaysOnTop: true,
				icon: path.join( __dirname, '../resource/icon.png')
			} );
			this.config.setMenu( null );
			this.config.loadURL( url.format( {
				pathname: path.join( __dirname, '../frontend/options.html'),
				protocol: "file"
			} ) );
			this.config.on( "closed", ( SELF => () => delete SELF.config )( this ) )
		}
	}
}
class DownloadManager {
	constructor ( { settings } ) {
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
	constructor ( { settings } ) {
		this.settings = settings;
	}
	
	initialize ( { Views } ) {
		this.counter = { toggleKey: 0, hidden: false };
		this.Views = Views;
	}

	listen () {
		electron.globalShortcut.register( "ESC", ( SELF => () => {
			setTimeout( ( SELF => () => SELF.counter.toggleKey = 0 )( SELF ), 1000 );
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
	constructor ( { settings } ) {
		this.settings = settings;
	}
	
	initialize ( { Views, Observer } ) {
		this.Views = Views;
		this.Observer = Observer;
	}
	
	listen () {
		this.Tray = new electron.Tray( path.join( __dirname, '../resource/icon.png') );
		let tray_menu = new electron.Menu();
		tray_menu.append( new electron.MenuItem( {
			label: "Show unread notifications",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Observer.showUnread();
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Clear unread notifications",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Observer.clear();
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			type: "separator"
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Maru Viewer",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Views.main();
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Show comic information pages",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Views.comic( {} );
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Show comic episode pages",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Views.episode( {} );
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			type: "separator"
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Settings",
			click: ( SELF => ( menuItem, browserWindow, event ) => {
				SELF.Views.configuration();
			} )( this )
		} ) );
		tray_menu.append( new electron.MenuItem( {
			type: "separator"
		} ) );
		tray_menu.append( new electron.MenuItem( {
			label: "Quit",
			role: "quit"
		} ) );
		this.Tray.setContextMenu( tray_menu );
		this.Tray.on( "click", ( SELF => ( menuItem, browserWindow, event ) => {
			SELF.Views.main();
		} )( this ) );
		this.Views.on( "updateTray",( SELF => () => {
			if ( SELF.Views.windows.length ) this.Tray.setToolTip( `MaruViewer is running (${SELF.Views.windows.length})` );
		} )( this ) );
	}

	close () {
		this.Tray.destroy();
		delete this.Tray;
	}
}
class NetworkManager {
	constructor ( { settings } ) {
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
	constructor ( { settings } ) {
		this.settings = settings;
	}
	initialize ( { Views, Downloader, config } ) {
		this.Views = Views;
		this.Downloader = Downloader;
		this.config = config;
	}

	listen () {
		electron.ipcMain.on( "open-comic", ( SELF => ( event, details ) => {
			SELF.Views.comic( { details: details.details } );
		} )( this ) );
		electron.ipcMain.on( "open-episode", ( SELF => ( event, details ) => {
			SELF.Views.episode( { uri: details.details.link } );
		} )( this ) );

		electron.ipcMain.on( "read-options", ( SELF => ( event, details ) => {
			event.sender.send( "read-options", SELF.settings );
		} )( this ) );
		electron.ipcMain.on( "apply-options", ( SELF => ( event, details ) => {
			SELF.config.set( details );
		} )( this ) );
		electron.ipcMain.on( "reset-options", ( SELF => ( event, details ) => {
			SELF.config.initialize( true )
				.options.then( json => event.sender.send( "read-options", json ) );
		} )( this ) );

		electron.ipcMain.on( "request-download", ( SELF => ( event, details ) => {
			console.log( SELF.settings.path );
			if ( SELF.settings.path && SELF.settings.path.length > 0 ) details.path = SELF.settings.path + '/' + details.title;
			else details.path = details.title;
			SELF.Downloader.download( details );
		} )( this ) );
	}

	close () {
		electron.ipcMain.removeAllListeners( "open-comic" );
		electron.ipcMain.removeAllListeners( "open-episode" );
		electron.ipcMain.removeAllListeners( "request-download" );
		electron.ipcMain.removeAllListeners( "reset-options" );
		electron.ipcMain.removeAllListeners( "apply-options" );
		electron.ipcMain.removeAllListeners( "read-options" );
	}
}
class NotificationManager {
	constructor ( { settings } ) {
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

	notify ( { title, body, uri, path, image } ) {
		if ( !this.active ) return false;
		return new Promise( ( resolve, reject ) => {
			this.notification.notify( {
				title,
				text: body,
				image: image,
				onClickFunc: ( ( { uri, path } ) => note => resolve( { uri, path, note } ) )( { uri, path } ),
				onCloseFunc: () => resolve( {} )
			} );
		} ).then( ( { uri, path, note } ) => {
				if ( note ) note.closeNotification();
				if ( uri ) this.Views.episode( { uri } );
				if ( path ) electron.shell.showItemInFolder( path );
		} ).catch( e => console.error( `Errors on notifying`, e ) );
	}

	listen () {
		this.active = true;
	}

	close () {
		this.active = false;
		try { this.notification.closeAll(); }
		catch ( e ) { console.error( `Errors on disabling notification module: ${e}` ); }
	}
}
class MaruObserver {
	constructor ( { settings } ) {
		this.settings = settings
	}

	initialize ( { Notifier } ) {
		this.Notifier = Notifier;
		this.unread = [];
	}

	clear ( uri ) {
		if ( uri ) {
			let index = this.unread.findIndex( item => item.link === uri );
			if ( index > -1 ) this.unread.splice( index, 1 );
		} else {
			while ( this.unread.length ) {
				this.unread.shift();
			}
		}
	}

	showUnread () {
		while ( this.unread.length ) {
			let item = this.unread.shift();
			this.Notifier.notify( { title: "Unread message - Comic updated", body: item.title, uri: item.link, image: item.image } );
		}
	}

	listen () {
		if ( this.observer ) return;
		this.observer = new electron.BrowserWindow( { show: false } );
		this.observer.loadURL( url.format( {
			pathname: path.join( __dirname, 'MaruObserver.html' ),
			protocol: "file"
		} ) );

		electron.ipcMain.on( "maru-updated", ( SELF => ( sender, message ) => {
			for ( const item of message ) {
				SELF.unread.push( item );
				SELF.Notifier.notify( { title: "Comic updated", body: item.title, uri: item.link, image: item.image } );
			}
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
class ConfigurationObserver {
	constructor ( { config } ) {
		this.config = config;
	}

	initialize ( { Views, Shortcut, Notifier, Observer, settings } ) {
		this.Views = Views;
		this.Shortcut = Shortcut;
		this.Notifier = Notifier;
		this.Observer = Observer;
		this.settings = settings;
	}

	listen () {
		this.config.addEventListener( "change", ( ( SELF ) => e =>  SELF.changed.call( SELF ) )( this ) );
		this.changed();
	}

	changed () {
		let settings = this.settings;

		WindowManager.findAndAction.call( this.Views, "main", window => window.webContents.send( "read-options", settings ) );

		if ( settings.shortcut ) this.Shortcut.listen();
		else this.Shortcut.close();

		if ( settings.notification ) this.Notifier.listen();
		else this.Notifier.close();

		if ( settings.updateChecker ) this.Observer.listen();
		else this.Observer.close();
	}

	close () {
		this.config.removeEventListenerAll( "change" );
	}
}
function init() {
	const defaultConfiguration = {
		resize: true,
		move: true,
		shortcut: true,
		updateChecker: true,
		notification: true,
		sameAuthor: true,
		path: `${electron.app.getPath( "downloads" )}/MaruViewer`
	};
	const settings = {};
	const config = new configIO( { file: "maruviewer.settings.json", writeOnChange: true, chainingObject: settings }, defaultConfiguration );
	config.initialize( false );
		//.addQueue( json => configIO.merge( settings, json, true ) );

	const Views = new WindowManager( { settings } );
	const Tray = new TrayManager( { settings } );
	const Shortcut = new ShortcutManager( { settings } );
	const Network = new NetworkManager( { settings } );
	const Communicator = new CommunicationManager( { settings } );
	const Downloader = new DownloadManager( { settings } );
	const Notifier = new NotificationManager( { settings } );
	const Observer = new MaruObserver( { settings } );
	const sharedConfig = new ConfigurationObserver( { config } );
	sharedConfig.initialize( { Views, Shortcut, Notifier, Observer, settings } );

	electron.app.on( 'browser-window-created', ( event, window ) => {
		window.on( "resize", ( ( { settings } ) => event => {
			let window = event.sender;
			if ( window.actionType && settings.resize ) {
				let [ width, height ] = window.getSize();
				if ( !settings[window.actionType] ) settings[window.actionType] = {};
				configIO.merge( settings[window.actionType], { width, height } );
				config.set( { update: Date.now() } );
			}
		} )( { settings } ) );
		window.on( "move", ( ( { settings, config } ) => event => {
			let window = event.sender;
			if ( window.actionType && settings.move ) {
				let [ x, y ] = window.getPosition();
				if ( !settings[window.actionType] ) settings[window.actionType] = {};
				configIO.merge( settings[window.actionType], { x, y } );
				config.set( { update: Date.now() } );
			}
		} )( { settings, config } ) );
	} );

	electron.app.on( 'window-all-closed', () => {
		/*
		Shortcut.close();
		Observer.close();
		Notifier.close();
		Tray.close();
		*/
		electron.app.quit();
	} );

	electron.app.on( 'ready', event => config.options.then( json => {
		Views.initialize( { defOpt: {
			width: 440,
			height: 740,
			show: false,
			minWidth: 320,
			minHeight: 440,
			icon: path.join( __dirname, '../resource/icon.png')
		}, Observer } );
		Tray.initialize( { Views, Observer } );
		Tray.listen();
		Shortcut.initialize( { Views } );
		Network.initialize();
		Network.listen();
		Communicator.initialize( { Views, Downloader, config } );
		Communicator.listen();
		Downloader.initialize( { Notifier } );
		Downloader.listen();
		Notifier.initialize( { Views, icon: path.join( __dirname, '../resource/icon.png') } );
		Observer.initialize( { Notifier } );
		sharedConfig.listen();

		Views.main();
		autoUpdater.checkForUpdatesAndNotify();
	} ).catch( e => console.error( "", e ) ) );

	if ( DEBUG ) {
		electron.app.commandLine.appendSwitch( 'remote-debugging-port', '9222' );
		electron.app.on( 'browser-window-created', ( event, window ) => {
			window.webContents.openDevTools( { mode: "detach" } );
		} );
	}
}

init();
