"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const { iOO } = require( "./ObjectObserver" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends iEventTarget {
		constructor ( { file, writeOnChange } = { file: "configIO.json", writeOnChange: false } ) {
			function init ( event ) {
				switch ( event.details.type ) {
					case "error":
						switch ( err.errno ) {
							case -4058:
								this.addEventListener( "file-write", ( event ) => { if ( event.details.type === "success" ) this.read(); }, { once: true } );
								this.write();
								break;
							default:
								break;
						}
						break;
					case "success":
						for ( const key of Object.keys( event.details.json ) ) this.iOO.addEventListener( "set", e => e.stopImmediatePropagation(), { once: true, prior: true } );
						Object.assign( this.config, event.details.json );
						this.removeEventListener( "file-read", init );
						break;
				}
			}

			super();
			this.iOO = new iOO( {} );
			this.iOO.IO = this;
			this.iOO.addEventListener( "set", this.onChange );
			this.iOO.addEventListener( "deleteProperty", this.onChange );
			if ( writeOnChange ) this.addEventListener( "change", ( event ) => {
				this.write( this.config, );
			} );
			this.config = this.iOO.Observed;
			this.file = file;
			this.addEventListener( "file-read", init );
			this.read();
		}

		onChange ( event ) {
			let details = event[event.type], changes;
			switch ( event.type ) {
				case "set":
					if ( details.object[details.propertyKey] !== details.value ) {
						changes = {
							old: { [details.propertyKey]: details.object[details.propertyKey] },
							new: { [details.propertyKey]: details.value }
						}
					}
					break;
				case "deleteProperty":
					if ( details.object[details.propertyKey] !== undefined ) {
						changes = {
							old: { [details.propertyKey]: details.object[details.propertyKey] },
							new: { [details.propertyKey]: undefined }
						}
					}
					break;
			}
			if ( changes !== undefined ) {
				let event = new Event( "change" );
				Object.assign( event, { details: changes } );
				this.IO.dispatchEvent.call( this.IO, event );
			}
		}

		async get ( keys = [] ) {
			let check = new Promise( ( resolve, reject ) => {
				if ( Object.keys( this.config ).length === 0 ) {
					this.addEventListener( "file-read", ( event ) => {
						if ( event.details.type === "success" ) { resolve( true ); }
						else setTimeout( () => { this.get( keys ).then( resolve ); }, 100 );
					}, { once: true } );
					this.read();
				} else {
					resolve( true );
				}
			} );
			if ( await check ) {
				if ( !( keys instanceof Array ) ) keys = [ keys ];
				if ( keys.length === 0 ) return Object.assign( {}, this.config );
				else {
					let result = {};
					for ( const key of keys ) if ( this.config[key] !== undefined ) Object.assign( result, { [key]: this.config[key] } );
					return result;
				}
			}
		}

		set set ( data ) {
			Object.assign( this.config, data );
		}

		set replace ( data ) {
			for ( const key of Object.keys( this.config ) ) {
				if ( !( key in data ) ) {
					delete this.config[ key ];
				}
			}
			Object.assign( this.config, data );
		}

		read () {
			let file = this.file;
			jsonfile.readFile( file, ( err, obj ) => {
				let event = new Event( "file-read" );
				if ( err !== null ) {
					event.details = { type: "error", file: file, info: err };
				}
				else {
					event.details = { type: "success", file: file, json: obj };
				}
				this.dispatchEvent( event );
			} );
		};
		write ( json = this.iOO[this.iOO.id] ) {
			let file = this.file;
			Object.assign( json, { update: new Date().toString() } );
			jsonfile.writeFile( file, json, { spaces: 2 }, ( err ) => {
				let event = new Event( "file-write" );
				if ( err !== null ) {
					event.details = { type: "error", file: file, info: err };
				}
				else {
					event.details = { type: "success", file: file };
				}
				this.dispatchEvent( event );
			} );
		};
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();