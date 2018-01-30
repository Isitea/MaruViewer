function Observer ( list = []) {
	let handler = {};
	for ( const key of list ) {
		handler[key] = ( target, key, value ) => { console.log( target, key, value ); };
	}

	return handler;
}
class Queue {
	constructor () {
		return ( async () => { return; } )();
	}
}
let Q = new Queue(), K = new Queue();
Q.then( async () => {
	let i, T = new Date().toString();
	for(i = 0; i < 10**4; i += parseInt( Math.random() * 100 ) ) if ( i % 10*2 === 0 ) console.log( `${T}: ${i}` );
	if ( i % 2 ) throw i;
	else return i;
} ).then( ( i ) => { console.log( "success", i ); return i; } ).catch( (i) => { console.log( "error", i ); return i; });
K.then( async () => {
	let i, T = new Date().toString();
	for(i = 0; i < 10**4; i += parseInt( Math.random() * 100 ) ) if ( i % 10*2 === 0 ) console.log( `${T}: ${i}` );
	if ( i % 2 ) throw i;
	else return i;
} ).then( ( i ) => { console.log( "success", i ); return i; } ).catch( (i) => { console.log( "error", i ); return i; });