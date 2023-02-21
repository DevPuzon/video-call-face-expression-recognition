
// let express = require( 'express' );
// let app = express();
// // var app = require('express')();
// var https = require('https');
// var fs = require( 'fs' );
// var io = require('socket.io')(server);
// let path = require( 'path' );

// var options = {

//     key: fs.readFileSync(path.join( __dirname, 'key.pem' ) ),
//     cert: fs.readFileSync(path.join( __dirname, 'cert.pem' ) ) ,

//     requestCert: false,
//     rejectUnauthorized: false
// }
// var server = https.createServer(options, app);
// server.listen(3000,'192.168.0.108');




// let stream = require( './ws/stream' );
// let favicon = require( 'serve-favicon' );

// app.use( favicon( path.join( __dirname, 'favicon.ico' ) ) );
// app.use( '/assets', express.static( path.join( __dirname, 'assets' ) ) );

// // app.get('/socket.io/socket.io.js', (req, res) => {
// //     res.sendFile((__dirname + '/node_modules/socket.io/client-dist/socket.io.js').replace("\src",""));
// //   });
// app.get( '/', ( req, res ) => {
//     res.sendFile( __dirname + '/index.html' );
// } );


// io.of( '/stream' ).on( 'connection', stream );








 



let express = require( 'express' );
let app = express();
let server = require( 'http' ).Server( app );
let io = require( 'socket.io' )( server );
let stream = require( './ws/stream' );
let path = require( 'path' );
let favicon = require( 'serve-favicon' );
 
app.use( '/assets', express.static( path.join( __dirname, 'assets' ) ) );

app.get( '/', ( req, res ) => {
    res.sendFile( __dirname + '/index.html' );
} );


app.get( '/not-allow', ( req, res ) => {
    res.sendFile( __dirname + '/not-allow.html' );
} );


io.of( '/stream' ).on( 'connection', stream );

server.listen( process.env.PORT || 4200)
console.log(`http://localhost:${process.env.PORT || 4200}`)



// server.listen( process.env.PORT || 4200,"192.168.0.108")
// console.log(`http://192.168.0.108:${process.env.PORT || 4200}`)


