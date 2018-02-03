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

	let TIMESTAMP = Date.now();
	class iEvent {
		constructor ( type, { cancelable } = { cancelable: false } ) {
			if ( type === undefined || type === null ) throw new TypeError( "Insufficient parameter with constructor." );
			this.type = type;
			Object.assign( this, {
				cancelable: cancelable || false,
				defaultPrevented: false,
				cancelBubble: false,
				timeStamp: Date.now() - TIMESTAMP
			} );
		}

		preventDefault () {
			if ( this.cancelable ) this.defaultPrevented = true;
		}
		stopPropagation () {
			this.stopImmediatePropagation();
		}
		stopImmediatePropagation () {
			this.cancelBubble = true;
		}
	}

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.iEvent = iEvent;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "iEvent", iEvent );

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