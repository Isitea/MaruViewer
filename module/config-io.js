"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const { iOO } = require( "./ObjectObserver" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends iEventTarget {
		constructor ( file = "maruviewer.settings.json" ) {
			super();
			this.iOO = new iOO( {} );
			this.iOO.IO = this;
			this.iOO.addEventListener( "set", this.onChange );
			this.iOO.addEventListener( "deleteProperty", this.onChange );
			this.config = this.iOO.Observed;
			this.file = file;
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

		read ( response ) {
			( ( res ) => { jsonfile.readFile( this.file, ( err, obj ) => {
				if ( err !== null ) console.log( err );
				else {
					this.set( obj );
					res( obj );
				}
			} ); } )( response );
		}

		write ( data ) {
			jsonfile.writeFile( this.file, data, ( err ) => {
				if ( err !== null ) console.log( err );
			} );
		}
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();