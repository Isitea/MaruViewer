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
class Loader extends Document {
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
		if ( ImgEx.parentNode instanceof HTMLElement ) ImgEx.parentNode.replaceChild( ImgEx );
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

//jQuery type doesn't require new operator but it automatically generate new Object each time when it is called.
/*function acrDOM ( root ) {
	let ROOT, NODE;
	if ( root instanceof Document ) ROOT = root;
	else if ( root instanceof HTMLElement ) {
		ROOT = root.ownerDocument;
		NODE = root;
	} else {
		try {
			ROOT = new Document();
		} catch ( e ) {
			ROOT = document.cloneNode( false );
		}

		if ( root instanceof Object ) NODE = this.create( root );
	}

	function create ( List ) {
		let iList = [], oList = [];
		if ( !( List instanceof Array ) ) iList.push( List );
		else iList = List;

		for ( let item of iList ) {
			switch ( typeof item ) {
				case "string":
					oList.push( ROOT.createTextNode( item ) );
					break;
				case "object":
					for ( const [ TagName, Attr ] of Object.entries( item ) ) {
						oList.push( ROOT.createElement( TagName ) );
						let _CHILD = Attr._CHILD;
						delete  Attr._CHILD;
						for ( const [ key, value ] of Object.entries( Attr ) )  {
							switch ( key ) {
								case "style":
									oList[ oList.length - 1 ].style.cssText = value;
									break;
								default:
									oList[ oList.length - 1 ][ key ] = value;
							}
						}
						if ( _CHILD !== undefined ) append( _CHILD, oList[ oList.length - 1 ] );
					}
					break;
				default:
			}
		}

		if ( List instanceof Array ) return oList;
		else return oList[0];
	}

	function append ( Child, Parent ) {
		let iChild = [], iParent;
		if ( !( Child instanceof Array || Child instanceof NodeList ) ) iChild.push( Child );
		else iChild = Child;
		if ( Parent === undefined ) iParent = NODE;
		else if ( Parent instanceof HTMLElement ) iParent = Parent;
		else iParent = create( Parent );

		for ( let item of iChild ) {
			iParent.appendChild( ( item instanceof Node ? item : create( item ) ) );
		}


		return acrDOM( iParent );
	}

	function remove ( List, parent = false ) {
		let iList = [];
		if ( !( List instanceof Array || List instanceof NodeList ) ) iList.push( List );
		else iList = List;

		iList.forEach( ( item ) => {
			if ( item !== null && item.parentNode !== null ) {
				if ( parent && item.parentNode.parentNode !== null && item.parentNode !== DOCUMENT.body ) item.parentNode.parentNode.removeChild( item.parentNode );
				else item.parentNode.removeChild( item );
			}
		} );
	}

	return {
		create: create,
		append: append,
		remove: remove
	};
}
*/

//Class type require new operator each initiation.
class acrDOM {
	constructor ( root ) {
		if ( root instanceof Document ) this.root = root;
		else if ( root instanceof HTMLElement ) {
			this.root = root.ownerDocument;
			this.node = root;
		} else {
			try {
				this.root = new Document();
			} catch ( e ) {
				this.root = document.cloneNode( false );
			}

			if ( root instanceof Object ) this.node = this.create( root );
		}

		return this;
	}

	create ( List ) {
		let iList = [], oList = [];
		if ( !( List instanceof Array ) ) iList.push( List );
		else iList = List;

		for ( let item of iList ) {
			switch ( typeof item ) {
				case "string":
					oList.push( this.root.createTextNode( item ) );
					break;
				case "object":
					for ( const [ TagName, Attr ] of Object.entries( item ) ) {
						switch ( TagName ) {
							case "imgex":
								try {
									if ( ImageEx !== undefined )  oList.push( new ImageEx() );
								}
								catch ( e ) {
									oList.push( this.root.createElement( "img" ) );
								}
								break;
							default:
								oList.push( this.root.createElement( TagName ) );
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

	append ( Child, Parent ) {
		let iChild = [], iParent;
		if ( !( Child instanceof Array || Child instanceof NodeList ) ) iChild.push( Child );
		else iChild = Child;
		if ( Parent === undefined ) iParent = this.node;
		else if ( Parent instanceof HTMLElement ) iParent = Parent;
		else iParent = this.create( Parent );

		for ( let item of iChild ) {
			iParent.appendChild( ( item instanceof Node ? item : this.create( item ) ) );
		}

		return this;
	}

	remove ( List, parent = false ) {
		let iList = [];
		if ( !( List instanceof Array || List instanceof NodeList ) ) iList.push( List );
		else iList = List;

		iList.forEach( ( item ) => {
			if ( item !== null && item.parentNode !== null ) {
				if ( parent && item.parentNode.parentNode !== null && item.parentNode !== DOCUMENT.body ) item.parentNode.parentNode.removeChild( item.parentNode );
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