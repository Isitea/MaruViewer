"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const { iOO } = require( "./ObjectObserver" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends iEventTarget {
		constructor ( file = "configIO.json" ) {
			super();
			this.iOO = new iOO( {} );
			this.iOO.IO = this;
			this.iOO.addEventListener( "set", this.onChange );
			this.iOO.addEventListener( "deleteProperty", this.onChange );
			this.config = this.iOO.Observed;
			this.file = file;
			const SELF = this;

			this.read = ( response, file = SELF.file ) => {
				return new Promise( ( resolve, reject ) => {
					jsonfile.readFile( file, ( err, obj ) => {
						if ( err !== null ) {
							switch ( err.errno ) {
								case -4058:
									SELF.write( { update: new Date().toString() }, ( data ) => {
										reject( response, file );
									}, file );
									break;
							}
						}
						else {
							this.set( obj );
							resolve( obj );
						}
					} );
				} ).then( response ).catch( SELF.read );
			};
			this.write = ( data, response, file = SELF.file ) => {
				return new Promise( ( resolve, reject ) => {
					Object.assign( data, { update: new Date().toString() } );
					jsonfile.writeFile( file, data, { spaces: 2 }, ( err ) => {
						if ( err !== null ) reject( err );
						else resolve( data );
					} );
				} ).then( response );

			};
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
				this.IO.dispatchEvent( event );
			}
		}

		get ( keys = [] ) {
			if ( !( keys instanceof Array ) ) keys = [ keys ];
			if ( keys.length === 0 ) return Object.assign( {}, this.config );
			else {
				let result = {};
				for ( const key of keys ) if ( this.config[key] !== undefined ) Object.assign( result, { [key]: this.config[key] } );
				return result;
			}
		}

		set ( data ) {
			for ( const key of Object.keys( this.config ) ) {
				if ( !( key in data ) ) {
					delete this.config[ key ];
				}
			}
			Object.assign( this.config, data );
		}
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();