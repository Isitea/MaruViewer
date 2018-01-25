"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends  iEventTarget {
		constructor ( file ) {
			function Observer ( list = []) {
				let handler = {};
				for ( const key of list ) {
					handler[key] = ( target, key, value ) => {
						return SELF.onChange( { name: key, value: target[key] }, { name: key, value: value }, target );
					};
				}

				return handler;
			}

			super();
			const SELF = this;
			this.config = new Proxy( {}, Observer( [ "set", "deleteProperty" ] ) );
			this.file = file;
		}

		onChange ( Old, New, target ) {
			if ( New.value === undefined ) delete target[New.name];
			else target[New.name] = New.value;
			let event = new Event( "change" );
			Object.assign( event, { old: Old, new: New } );
			this.dispatchEvent( event );

			return true;
		}

		get ( key ) {
			if ( key === undefined ) return Object.assign( {}, this.config );
			return this.config[key];
		}

		overwrite ( data ) {
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
					this.overwrite( obj );
					res( obj );
				}
			} ); } )( response );
		}

		write ( data ) {
			jsonfile.writeFile( "maruviewer.settings.json", data, ( err ) => {
				if ( err !== null ) console.log( err );
			} );
		}
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();