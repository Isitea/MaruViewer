"use strict";
function Ajax ( url, type = "document", response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = type;
	//xhr.onreadystatechange = ( e ) => { console.log( e.target.readyState, e.target.responseURL,e.target.status ); };
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );

	xhr.send();
}

function SearchOnMaru ( title ) {
	let acr = new acrDOM( document.querySelector( ".query-result" ) );
	acr.remove( document.querySelectorAll( ".query-result > div" ) );

	Ajax( "http://marumaru.in/?mod=search&keyword=QUERY".replace( /QUERY/gi, title ), "document", ( ev, DOCUMENT ) => {
		let ComicList = DOCUMENT.querySelectorAll( "#rcontent #s_post .postbox > a.subject[href*=manga]" );
		if ( ComicList.length > 0 ) {
			ComicList.forEach( ( Anchor ) => {
				let info = {
					title: Anchor.querySelector( ".sbjbox" ).innerText.replace( /\s+/gi, ""),
					link: Anchor.href,
					image: ( Anchor.querySelector( ".thumb img" ) ? Anchor.querySelector( ".thumb img" ).src : "" )
				};
				createComicInformationBox( acr, info );
			} );
		}
	} );
}

function createComicInformationBox ( acrDOM, info ) {
	acrDOM.append( {
		div: {
			className: "comic-infomation-box",
			dataset: { link: info.link },
			_CHILD: [
				{
					imgex: {
						className: "graphic",
						url: info.image
					}
				},
				{
					div: {
						className: "text",
						_CHILD: [
							{
								div: {
									_CHILD: [
										{
											div: {
												className: "",
												innerText: info.title
											}
										},
										{
											div: {
												className: "",
												innerText: info.title
											}
										}
									]
								}
							},
							{
								div: {
									_CHILD: [
										{
											div: {
												className: "",
												innerText: info.title
											}
										},
										{
											div: {
												className: "",
												innerText: info.title
											}
										}
									]
								}
							}
						]
					}
				}
			]
		}
	} );
}

//Own class which mimics EventTarget object
class iEventTarget {
	constructor () {
		this.listeners = {};
		this.oncelisteners = {};
	}

	addEventListener ( type, callback, { once: once } = { once: false } ) {
		if ( once ) {
			if ( !( type in this.oncelisteners ) ) this.oncelisteners[ type ] = [];
			if ( !this.oncelisteners[ type ].includes( callback ) ) this.oncelisteners[ type ].push( callback );
		} else {
			if ( !( type in this.listeners ) ) this.listeners[ type ] = [];
			if ( !this.listeners[ type ].includes( callback ) ) this.listeners[ type ].push( callback );
		}
	}

	removeEventListener ( type, callback ) {
		if ( type in this.listeners ) {
			let stack = this.listeners[ type ];
			if ( stack.includes( callback ) ) stack.splice( stack.indexOf( callback ), 1 );
		}
	}

	dispatchEvent ( event ) {
		if ( event.type in this.listeners || event.type in this.oncelisteners ) {
			if ( event.type in this.listeners ) {
				let stack = this.listeners[ event.type ];
				for ( let i = 0; i < stack.length; i++ ) {
					stack[i].call( this, event );
				}
			}
			if ( event.type in this.oncelisteners ) {
				let stack = this.oncelisteners[ event.type ];
				while ( stack.length > 0 ) {
					stack.pop().call( this, event );
				}
			}
			return !event.defaultPrevented;
		} else return true;
	}
}
//Own class ImageEx which extends Image object
class ImageEx extends Image {
	constructor ( { width: width, height: height, encapsule: encapsule, showOnComplete: showOnComplete } = { encapsule: false, showOnComplete: false } ) {
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

		super( width, height );
		let SELF = this, xhr = new XMLHttpRequest();
		this.requester = xhr;
		xhr.responseType = "blob";
		if ( !showOnComplete ) xhr.addEventListener( "loadstart", showImage );
		xhr.addEventListener( "progress", onProgress );
		xhr.addEventListener( "error", onProgress );
		xhr.addEventListener( "timeout", onProgress );
		//xhr.addEventListener( "abort", onProgress );
		xhr.addEventListener( "load", onProgress );
		//xhr.addEventListener( "loadend", onProgress );
		if ( encapsule ) {
			xhr.addEventListener( "load", () => { this.src = URL.createObjectURL( xhr.response ); } );
			this.addEventListener( "load", () => { URL.revokeObjectURL( this.src ); } );
		} else if ( showOnComplete ) xhr.addEventListener( "load", showImage );
	}

	set url ( url ) {
		let xhr = this.requester;
		xhr.open( "GET", url, true );
		return xhr.send();
	}

	load ( url ) {
		let xhr = this.requester;
		xhr.open( "GET", url, true );
		xhr.send();
	}
}
//Own class which manages ImageEx objects
class Loader extends iEventTarget {
	constructor ( opt = { encapsule: false, showOnComplete: false } ) {
		super();
		this.iList = [];
		this.ImgEx = () => {
			let ImgEx = new ImageEx( opt );
			ImgEx.addEventListener( "Progress", this );
			ImgEx.addEventListener( "Error", this );
			this.iList.push( ImgEx );
			return ImgEx;
		};
	}

	handleEvent ( event ) {
		switch ( event.type ) {
			case "Progress":
				let LP_Event = new Event( "Loader-Progress" );
				Object.assign( LP_Event, { received: { total: 0, loaded: 0 }, count: { total: this.iList.length, unknown: 0 } } );
				this.iList.forEach( ( ImgEx ) => {
					if ( ImgEx.loader && ImgEx.loader.total !== 0 ) {
						LP_Event.received.total += ImgEx.loader.total;
						LP_Event.received.loaded += ImgEx.loader.loaded;
					} else {
						LP_Event.count.unknown++;
					}
				} );
				this.dispatchEvent( LP_Event );
				break;
			case "Error":
				console.log( `URL:${event.ImageEx.requester.responseURL}` + '\n' +  `Reason: ${event.reason.detail}` );
				switch ( event.reason.type ) {
					case "Type error":
						this.remove( event.ImageEx );
						break;
					case "Network error":
						break;
				}
				break;
		}
	}

	add ( Obj ) {
		let ImgEx = this.ImgEx();
		if ( Obj instanceof HTMLElement ) {
			if ( Obj instanceof Image ) {
				Obj.parentNode.replaceChild( ImgEx, Obj );
				ImgEx.load( Obj.src );
			} else {
				ImgEx.load( Obj.dataset.original || Obj.src )
			}
		} else {
			ImgEx.load( Obj );
		}

		return this;
	}
	remove ( ImgEx ) {
		if ( ImgEx.parentNode instanceof HTMLElement ) ImgEx.parentNode.removeChild( ImgEx );
		this.iList.splice( this.iList.indexOf( ImgEx ), 1 );

		return this;
	}
	get urls () {
		let list = [];
		this.iList.forEach( ( ImgEx ) => { list.push( ImgEx.requester.responseURL ); } );

		return list;
	}
	get list () {
		return this.iList;
	}
	set list ( urls ) {
		let SELF = this;
		urls.forEach( ( url ) => { SELF.add( url ); } );

		return this.iList;
	}

}
//Class type require new operator each initiation.
class acrDOM {
	constructor ( node ) {
		if ( node instanceof HTMLElement ) this.node = node;
		else if ( node instanceof Object ) this.node = this.append( node, document.body );
		else this.node = document.body;

		return this;
	}

	create ( List ) {
		let iList = [], oList = [];
		if ( !( List instanceof Array ) ) iList.push( List );
		else iList = List;

		for ( let item of iList ) {
			switch ( typeof item ) {
				case "string":
					oList.push( document.createTextNode( item ) );
					break;
				case "object":
					for ( const [ TagName, Attr ] of Object.entries( item ) ) {
						switch ( TagName ) {
							case "imgex":
								try {
									if ( ImageEx !== undefined )  oList.push( new ImageEx() );
								}
								catch ( e ) {
									oList.push( new Image() );
								}
								break;
							default:
								oList.push( document.createElement( TagName ) );
						}
						let _CHILD = Attr._CHILD;
						delete  Attr._CHILD;
						for ( const [ key, value ] of Object.entries( Attr ) )  {
							switch ( key ) {
								case "dataset":
									for ( const [ data_key, data_value ] of Object.entries( value ) ) {
										oList[ oList.length - 1 ].dataset[data_key] = data_value;
									}
									break;
								case "style":
									oList[ oList.length - 1 ].style.cssText = value;
									break;
								default:
									oList[ oList.length - 1 ][ key ] = value;
							}
						}
						if ( _CHILD !== undefined ) this.append( _CHILD, oList[ oList.length - 1 ] );
					}
					break;
				default:
			}
		}

		if ( List instanceof Array ) return oList;
		else return oList[0];
	}

	append ( Child, Parent = this.node ) {
		let iChild = [], iParent;
		if ( !( Child instanceof Array || Child instanceof NodeList ) ) iChild.push( Child );
		else iChild = Child;
		if ( Parent instanceof HTMLElement ) iParent = Parent;
		else iParent = this.create( Parent );

		for ( let item of iChild ) {
			iParent.appendChild( ( item instanceof Node ? item : this.create( item ) ) );
		}

		if ( Parent instanceof HTMLElement ) return this;
		else return iParent;
	}

	remove ( List, parent = false ) {
		let iList = [];
		if ( !( List instanceof Array || List instanceof NodeList ) ) iList.push( List );
		else iList = List;

		iList.forEach( ( item ) => {
			if ( item !== null && item.parentNode !== null ) {
				if ( parent && item.parentNode.parentNode !== null && item.parentNode !== item.ownerDocument.body ) item.parentNode.parentNode.removeChild( item.parentNode );
				else item.parentNode.removeChild( item );
			}
		} );
	}
}

function tempMain () {

	document.querySelector( ".search-panel .search-start" ).addEventListener( "click", ( e ) => {
		SearchOnMaru( document.querySelector( ".search-panel .search-query" ).value );
	} );
}

document.addEventListener( "DOMContentLoaded", tempMain );