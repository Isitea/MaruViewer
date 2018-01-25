"use strict";
( () => {
	let moduleLoader;
	try { if ( require ) moduleLoader = "CommonJS"; } catch ( e ) {}
	try { if ( requirejs ) moduleLoader = "AMD"; } catch ( e ) {}

	let moduleExporter, iEventTarget;
	switch ( moduleLoader ) {
		case "CommonJS":
			( ( modEx ) => { moduleExporter = modEx.moduleExporter; } )( require( "./module-exporter" ) );
			( ( modEx ) => { iEventTarget = modEx.iEventTarget; } )( require( "./iEventTarget" ) );
			break;
		case "AMD":
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx; } );
			requirejs( [ './iEventTarget' ], ( modEx ) => { iEventTarget = modEx; } );
			break;
		case undefined:
			iEventTarget = window.iEventTarget;
			break;
	}

	//Own class which manages ImageEx objects
	class ImageExLoader extends iEventTarget {
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

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.ImageExLoader = ImageExLoader;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "ImageExLoader", ImageExLoader );

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