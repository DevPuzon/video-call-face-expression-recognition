
let rooms = []

const stream = ( socket ) => {
    socket.on( 'subscribe', ( data ) => {
        subscribe(data);
    } );  
    function subscribe(data){
        //subscribe/join a room
        console.log("subscribe",data);
        socket.join( data.room );
        socket.join( data.socketId );

        let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
        if(roomFI < 0){
            rooms.push({room:data.room,host:data.socketId,participants:[],socketIdEmojiIndex:{},emojis:[0,0,0,0,0,0,0]}); 
            socket.join( data.socketId+"-host" );
            console.log("subscribe allow-user",data.socketId+"-host");
        }
        // else{
        //     setTimeout(() => { 
        //         initial(data);  
        //     }, 2000);
        // }
        
        //Inform other members in the room of new user's arrival
        // socket.to( data.room ).emit( 'allow-user', {room:data.room,socketId:data.socketId } );
        // socket.to( data.room ).emit( 'set-room', {room:data.room,socketId:data.socketId } );
        if ( socket.adapter.rooms.has(data.room) === true ) { 
           setTimeout(() => {
                let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
                if(data.socketId != rooms[roomFI].host && rooms[roomFI].participants.find((el)=>{return el == data.socketId;})){ 
                    socket.emit( 'new user', { room:data.room,socketId: data.socketId,username:data.username , roomDetails:rooms[roomFI]} );
                }
                if(data.socketId == rooms[roomFI].host){
                    socket.emit( 'new user', { room:data.room,socketId: data.socketId,username:data.username , roomDetails:rooms[roomFI]} );
                }
           }, 2000);
        }
        console.log(rooms);
    }

    socket.on( 'pre-join', ( data ) => {
        let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
        if(roomFI < 0){
            subscribe(data);
        }else{
            setTimeout(() => { 
                initial(data);  
            }, 2000);
        } 
    } ); 
    
    
    socket.on( 'initial', ( data ) => { 
        initial(data);
    });   

    function initial(data){ 
        let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
        if(roomFI < 0){
            rooms.push({room:data.room,host:data.socketId,participants:[]});
        } 
        if(data.socketId != rooms[roomFI].host){ 
            console.log("initial",data,rooms[roomFI]);
            socket.emit( 'initial', {room:data.room,socketId:data.socketId,hostId:rooms[roomFI].host,
            isAllow : rooms[roomFI].participants.find((el)=>{return el == data.socketId;}) ? true : false } );
        }
    }

    socket.on( 'allow-user', ( data ) => {  
        console.log("allow-user",data.hostId+"-host",data);
        socket.to( data.hostId+"-host" ).emit( 'allow-user', {...data } );
    }); 

    socket.on( 'set-allow-user', ( data ) => {  
        let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
        if(data.isAllow){
            rooms[roomFI].participants.push(data.socketId);   
            setTimeout(() => { 
                socket.emit( 'new user', { room:data.room,socketId: data.socketId,username:data.username , roomDetails:rooms[roomFI]} );
           }, 2000);
        }else{
            rooms[roomFI].participants.push(data.socketId);
        }
        socket.to( data.socketId ).emit( 'set-allow-user', {...data,isAllow:data.isAllow} );
    });  

    socket.on( 'newUserStart', ( data ) => {   
        socket.to( data.to ).emit( 'newUserStart', { sender: data.sender,username:data.username ,roomDetails:data.roomDetails } );
    } ); 

    socket.on( 'sdp', ( data ) => {
        socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
    } );


    socket.on( 'ice candidates', ( data ) => {
        socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
    } );


    socket.on( 'chat', ( data ) => {
        socket.to( data.room ).emit( 'chat', { sender: data.sender, msg: data.msg } );
    } ); 

    socket.on( 'update-emojis', ( data ) => { 
        let {socketId,emojiIndex} = data;
        let roomFI = rooms.findIndex((el)=>{return el.room == data.room;});
        let room = rooms[roomFI];
        if(roomFI >= 0){
            rooms[roomFI].socketIdEmojiIndex[socketId] = emojiIndex;
            rooms[roomFI].emojis = [0,0,0,0,0,0,0]; 
            for(let val of Object.keys(rooms[roomFI].socketIdEmojiIndex) ){
                rooms[roomFI].emojis[
                    rooms[roomFI].socketIdEmojiIndex[val]
                ] += 1;
            }``
            // for(let [i,emoji] of room.emojis.entries()){
            //     rooms[roomFI].emojis[i] += data.emojis[i];
            // } 
            console.log( 'update-emojis',data,
            rooms[roomFI],
            rooms[roomFI].emojis); 

            socket.emit( 'update-emojis', 
            { 
                room: data.room, 
                emojis: rooms[roomFI].emojis,
                participantsEmoji : rooms[roomFI].socketIdEmojiIndex
            });
        }
    } );

};

module.exports = stream;
