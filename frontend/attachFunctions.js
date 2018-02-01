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

