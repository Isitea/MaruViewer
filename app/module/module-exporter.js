"use strict";
( () => {
	class moduleExporter {
		constructor () {
			//Check module loader style
			//Module exports for CommonJS
			try {
				if ( module ) this.style = "CommonJS";
			} catch ( e ) {
				//if ( e.message === "module is not defined" ) console.log( "Module loader doesn't support CommonJS style." );
			}
			//Module exports for Asynchronous Module Definition
			try {
				if ( define ) this.style = "AMD";
			} catch ( e ) {
				//if ( e.message === "define is not defined" ) console.log( "Module loader doesn't support AMD style." );
			}

			switch ( this.style ) {
				case undefined:
					console.log( "Currently running javascript engine doesn't support module.\nExporter will attach to window" );
					this.style = "Browser";
					break;
				case "CommonJS":
					this.modules = {};
					console.log( "System is using CommonJS style module loader." );
					break;
				case "AMD":
					this.modules = {};
					console.log( "System is using AMD(Asynchronous Module Definition) style module loader." );
					break;
			}
		}

		export ( name, fn ) {
			switch ( this.style ) {
				case "CommonJS":
					this.modules[name] = fn;
					break;
				case "AMD":
					this.modules[name] = fn;
					break;
			}
		}

		build ( builder, dep = [] ) {
			if ( builder === undefined ) {
				switch ( this.style ) {
					case "CommonJS":
						Object.assign( module.exports, this.modules );
						break;
					case "AMD":
						if ( dep.length > 0 ) { define( dep, this.modules ); }
						else { define( this.modules ); }
						break;
				}
			} else {
				switch ( this.style ) {
					case "CommonJS":
						Object.assign( builder.exports, this.modules );
						break;
					case "AMD":
						if ( dep.length > 0 ) { builder( dep, this.modules ); }
						else { builder( this.modules ); }
						break;
					case "Browser":
						Object.assign( window, this.modules );
						break;
				}
			}
		}
	}

	const modEx = new moduleExporter();
	modEx.export( "moduleExporter", moduleExporter );
	modEx.build();
} ) ();