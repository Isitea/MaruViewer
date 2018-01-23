"use strict";
function test ( k ) { console.log(k); }

//Module exports for ECMA Script 6+
//export { test };

//Module exports for CommonJS
try {
	exports.test = test;
} catch ( e ) {
	if ( e.message === "exports is not defined" ) console.log( "Module loader doesn't support CommonJS style." );
}
//Module exports for Asynchronous Module Definition
try {
	define( 'test', [ 'k' ], { test: test } );
} catch ( e ) {
	if ( e.message === "define is not defined" ) console.log( "Module loader doesn't support AMD style." );
}