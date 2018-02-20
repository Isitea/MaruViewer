"use strict";
( () => {
	let moduleLoader;
	try { if ( require ) moduleLoader = "CommonJS"; } catch ( e ) {}
	try { if ( requirejs ) moduleLoader = "AMD"; } catch ( e ) {}

	let moduleExporter;
	switch ( moduleLoader ) {
		case "CommonJS":
			( ( modEx ) => { moduleExporter = modEx.moduleExporter; } )( require( "./module-exporter" ) );
			break;
		case "AMD":
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx; } );
			break;
		case undefined:
			break;
	}

	//Class type require new operator each initiation.
	class acrDOM {
		constructor ( node ) {
			if ( node instanceof HTMLElement ) this.node = node;
			else if ( node instanceof Object ) {
				this.node = this.create( node );
				this.append( this.node, document.body );
			}
			else this.node = document.body;

			return this;
		}

		change ( Child ) {
			let node = this.create( Child );
			this.append( node );
			this.node = node;

			return this;
		}
		create ( List ) { return this.constructor.create.call( this.constructor, List ); }
		append ( Child, Parent = this.node ) {
			let result = this.constructor.append.call( this.constructor, Child, Parent );
			if ( result === Parent ) return this;
			else return result;
		}
		remove ( List, parent = false ) { return this.constructor.remove.call( this.constructor, List, parent ); }

		static create ( List ) {
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
								case "iframe":
									let iframe = document.createElement( "iframe" );
									oList.push( iframe );
									setTimeout( ( iframe => {
										function DOMContentLoaded ( e ) {
											let event = new Event( "DOMContentLoaded" );
											event.window = iframe.contentWindow;
											iframe.dispatchEvent( event );
											iframe.contentDocument.dispatched = true;
										}
										function readystatechange ( e ) {
											let event = new Event( "readystatechange" );
											iframe.dispatchEvent( event );
										}
										function FrameUnload () {
											iframe.contentDocument.dispatched = false;
											let event = new Event( "FrameUnload" );
											event.window = iframe.contentWindow;
											iframe.dispatchEvent( event );
										}
										function unload () {
											iframe.contentWindow.addEventListener( "unload", FrameUnload );
											iframe.contentDocument.addEventListener( "DOMContentLoaded", DOMContentLoaded );
											iframe.contentDocument.addEventListener( "readystatechange", readystatechange );
											if ( iframe._pastDocument !== iframe.contentDocument && !( iframe.contentDocument.URL === "about:blank" && iframe.contentWindow.history.length === 1 ) ) {
												iframe._pastDocument = iframe.contentDocument;
											}
											if ( !iframe.contentDocument.dispatched ) {
												iframe.interval = setTimeout( unload );
											}
										}
										iframe.addEventListener( "FrameUnload", unload );
										return unload;
									} )( iframe ) );
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
									case "enabled":
									case "disabled":
										oList[ oList.length - 1 ].setAttribute( key, true );
										break;
									case "addEventListener":
										for ( event of value ) {
											oList[ oList.length - 1 ][ key ]( event.type, event.listener, event.option || {} );
										}
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

		static append ( Child, Parent ) {
			if ( Parent === undefined ) return false;
			let iChild = [], iParent;
			if ( !( Child instanceof Array || Child instanceof NodeList ) ) iChild.push( Child );
			else iChild = Child;
			if ( Parent instanceof HTMLElement ) iParent = Parent;
			else iParent = this.create( Parent );

			for ( const item of iChild ) {
				iParent.appendChild( ( item instanceof Node ? item : this.create( item ) ) );
			}

			return iParent;
		}

		static remove ( List, parent = false ) {
			let iList = [];
			if ( !( List instanceof Array || List instanceof NodeList ) ) iList.push( List );
			else iList = List;

			iList.forEach( ( item ) => {
				if ( !( item instanceof HTMLBodyElement ) && item !== null && item.parentNode !== null ) {
					if ( parent && item.parentNode.parentNode !== null && item.parentNode !== item.ownerDocument.body ) item.parentNode.parentNode.removeChild( item.parentNode );
					else item.parentNode.removeChild( item );
				}
			} );

			return iList;
		}
	}

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.acrDOM = acrDOM;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "acrDOM", acrDOM );

		switch ( moduleLoader ) {
			case "CommonJS":
				modEx.build( module );
				break;
			case "AMD":
				modEx.build( define );
				break;
		}
	}
} ) ();