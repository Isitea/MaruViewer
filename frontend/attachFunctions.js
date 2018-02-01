"use strict";

/**
 * attachFunctions.js make specific sites can use several functionalities in this extension.
 * @author Isitea<isitea@isitea.net>
 */
function configManager ( response  = function () {}, area = "local" ) {
	function load ( area ) {
		Object.assign( config, area );
		response( _SELF );
	}

	let config = {}, _SELF = this;

	this.read = ( field ) => {
		return config[ field ];
	};
	this.onChanges = ( changes = {}, active = "" ) => {
		if ( area !== active ) return;
		for ( let key in changes ) {
			if ( changes.hasOwnProperty( key ) ) {
				if ( changes[key].newValue === undefined ) {
					delete changes[key];
				} else {
					config[ key ] = changes[ key ].newValue;
				}
			}
		}

		response( _SELF );

		return _SELF;
	};
	this.setResponse = ( func = () => {} ) => {
		response = func;

		return _SELF;
	};
	this.load = load;

	//chrome.storage.onChanged.addListener( this.onChanges );

	_SELF.load();
}

//Own class which mimics EventTarget object
function contentManager ( DOCUMENT = document, title = "" ) {
	function escapeCharacter ( string ) {
		return string
			.replace( /\.\.+/g, "⋯" )
			.replace( /!+/g, "！" )
			.replace( /\?+/g, "？" )
			.replace( /\/+/g, "／" )
			.replace( /\\+/g, "＼" )
			.replace( /:+/g, "：" )
			.replace( /~+/g, "∼" )
			.replace( /<+/g, "＜" )
			.replace( />+/g, "＞" )
			.replace( /\|+/g, "｜" )
			.replace( /(！？)+！?/g, "⁉" )
			.replace( /？⁉|(？！)+/g, "⁈" )
			.replace( /[\r\n\s]+/g, " " )
			.replace( /^[.\s]*|[.\s]*$/g, "" )
	}

	const _SELF = this, iLoader = new ImageExLoader();
	let episode = "", response = () => {};

	this.title = ( e, NT = undefined ) => {
		if ( NT !== undefined ) title = NT;
		if ( e === undefined ) return title;
		title = escapeCharacter( title ).replace( e, "" ).replace( /^[.\s]*|[.\s]*$/g, "" );
		document.title = title + " - " + episode;

		return title;
	};
	this.episode = ( e ) => {
		if ( !e ) {
			return episode;
		} else {
			episode = escapeCharacter( e );
			_SELF.title( episode );
		}

		return episode;
	};
	this.counts = () => { return iLoader.list.length; };
	this.load = ( Obj ) => { iLoader.add( Obj ); };
	this.place = ( container ) => {
		iLoader.list.forEach( ( ImgEx ) => {
			container.appendChild( ImgEx );
			container.appendChild( document.createElement( "br" ) );
		} );
	};
	this.download = ( e ) => {
		let ArcList = {
			method: "download",
			downloadFrom: location.href,
			title: title,
			episode: episode,
			Lists: iLoader.urls
		};
		chrome.runtime.sendMessage( ArcList );
		//_SELF.download = function () {};
		if ( e !== null && e !== undefined && e instanceof HTMLElement ) e.click();
	};
	this.getItem = ( index ) => { return iLoader.list[ index ]; };
	this.setResponse = ( action ) => { response = action; };
	this.complete = ( event ) => {
		if ( event && event.count && event.count.total > 0 ) {
			response( parseInt( event.received.loaded / ( event.received.total + ( event.received.total / ( event.count.total - event.count.unknown ) ) * event.count.unknown ) * 100 ) );
		} else {
			response( 0 );
		}
	};

	iLoader.addEventListener( "Loader-Progress", _SELF.complete );
}

function ImageExForFF ( { width, height, encapsule, showOnComplete } = { encapsule: false, showOnComplete: false } ) {
	function onProgress ( progress ) {
		switch ( progress.type ) {
			case "progress":
			case "load":
				if ( this.response !== null && this.response.type.match( 'image' ) === null ) {
					this.abort();
					let error = new Event( "Error" );
					Object.assign( error, { reason: { type: "Type error", detail: "Response MIME mismatch." }, ImageEx: SELF } );
					SELF.src = undefined;
					SELF.dispatchEvent( error );
				} else {
					let event = new Event( "Progress" ), loader = { total: progress.total, loaded: progress.loaded };
					Object.assign( event, { progress: loader, status: progress.type } );
					Object.assign( SELF, { loader: loader } );
					if ( progress.total !== progress.loaded || progress.type === "load" ) SELF.dispatchEvent( event );
				}
				break;
			case "error":
			case "timeout":
				let error = new Event( "Error" );
				Object.assign( error, { reason: { type: "Network error", detail: "Connection lost.", ImageEx: SELF , statusCode: this.status, statusText: this.statusText} } );
				SELF.dispatchEvent( error );
				break;
		}
	}

	function showImage () {
		xhr.addEventListener( "progress", () => { SELF.src = xhr.responseURL; }, { once: true } );
	}

	console.log( "Trying to avoid permission error which occurs in Firefox, only." );
	const SELF = new Image( width, height ), xhr = new XMLHttpRequest();
	SELF.load = ( url ) => {
		let xhr = SELF.requester;
		xhr.open( "GET", url, true );
		return xhr.send();
	};
	SELF.requester = xhr;
	xhr.responseType = "blob";
	if ( !showOnComplete ) xhr.addEventListener( "loadstart", showImage );
	xhr.addEventListener( "progress", onProgress );
	xhr.addEventListener( "error", onProgress );
	xhr.addEventListener( "timeout", onProgress );
	//xhr.addEventListener( "abort", onProgress );
	xhr.addEventListener( "load", onProgress );
	//xhr.addEventListener( "loadend", onProgress );
	if ( encapsule ) {
		xhr.addEventListener( "load", () => { SELF.src = URL.createObjectURL( xhr.response ); } );
		SELF.addEventListener( "load", () => { URL.revokeObjectURL( SELF.src ); } );
	} else if ( showOnComplete ) xhr.addEventListener( "load", showImage );

	Object.assign( SELF, {
		set url ( url ) {
			return SELF.load( url );
		},

	} );

	return SELF;
}
