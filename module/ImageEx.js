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
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx.moduleExporter; } );
			break;
		case undefined:
			break;
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
			return this.load( url );
		}

		load ( url ) {
			if ( url === "" || url === undefined ) return false;

			let xhr = this.requester;
			xhr.open( "GET", url, true );
			xhr.send();

			return true;
		}
	}

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.ImageEx = ImageEx;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "ImageEx", ImageEx );

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