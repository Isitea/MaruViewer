"use strict";
function Ajax ( url, response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = "document";
	//xhr.onreadystatechange = ( e ) => { console.log( e.target.readyState, e.target.responseURL,e.target.status ); };
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );

	xhr.send();
}

Ajax( "http://marumaru.in/?mod=search&keyword=QUERY".replace( /QUERY/gi, "러브" ), ( ev, DOCUMENT ) => {
	let ComicList = DOCUMENT.querySelectorAll( "#rcontent #s_post .postbox > a.subject[href*=manga]" );
	if ( ComicList.length > 0 ) {
		ComicList.forEach( ( Anchor ) => {
			let info = {
				title: Anchor.querySelector( ".sbjbox" ).innerText.replace( /\s+/gi, ""),
				link: Anchor.href,
				image: ( Anchor.querySelector( ".thumb img" ) ? Anchor.querySelector( ".thumb img" ).src : undefined )
			};
			acrDOM( document.body ).append( { div: { _CHILD: { a: { innerText: `Title: ${info.title}`, href: info.link, _CHILD: { img: { src: info.image } } } } } } );
		} );
	}
} );

function acrDOM ( root ) {
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

/* Class type require new operator each initiation.
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
						oList.push( this.root.createElement( TagName ) );
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

		return iParent;
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
*/