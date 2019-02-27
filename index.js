const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Managing usernames
let usedUsers = [];
let availUsers = ["Danyell","Marjory","Nereida","Madie","Shavonda","Lucrecia","Dina","Jarvis","Paris","Euna","Michaela","Stefanie","Herminia","Arla","Rolland","Preston","Johnsie","Sunday","Alisia","Allyn"]

// Connected Users
let activeUsers = [];

let messageLog = [];

function getTime(){
    const now = new Date();
    return `[${now.getHours()}:${now.getMinutes()}]`;
}

app.get('/', (req, res) => {
    // const userExist = req.headers.cookie.split(';').find(cookie => cookie.includes('boo='));
    // if (userExist){
        
    // }
    //const user = connection.split('=')[1].trim();
    // console.log(user);
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

    // Checking if user exist and assigning name
    const cookie = socket.client.request.headers.cookie;
    const userCookie =  cookie && cookie.split(';').find(cookie => cookie.includes('user='));
    let user = userCookie && userCookie.split('=')[1];
    
    // If there are users, Add it to the list
    if (user){
        // Only add to active user if he is not there
        !activeUsers.includes(user) && activeUsers.push(user);
        socket.emit('setUser', user);
    }
    else{
        // Generating new name for the user
        user = availUsers[Math.floor(Math.random()*availUsers.length)];
        usedUsers.push(user);
        // Removing it from list of possible users
        availUsers.splice(availUsers.indexOf(user),1);
        activeUsers.push(user);
        socket.emit('setUser',user);
    }

    // Letting people know who connected
    socket.broadcast.emit('status', `${user} has joined the chat`);

    // Updating userlist
    io.emit('userList', JSON.stringify(activeUsers));

    // Sending the Chat History
    socket.emit('history', JSON.stringify(messageLog));


    // Sending Messages
    socket.on('message', msg => {
        const message = {date : new Date(), ...JSON.parse(msg)};
        messageLog.push(message);
        io.emit('message', JSON.stringify(message));
    });

    socket.on('nickname', name => {
        if(activeUsers.find(user => user === name)){
            socket.emit('status', 'Name in use. Your name was not changed.')
        }else{
            activeUsers[activeUsers.indexOf(user)] = name;
            socket.emit('setUser', name);
            socket.emit('status', `Your name has been changed to ${name}`);
            socket.broadcast.emit('status', `${user} has changed his name to ${name}`);
            io.emit('userList', JSON.stringify(activeUsers));
            user = name;
        }        
    });

    // On Disconnect
    socket.on('disconnect', () => {
        socket.broadcast.emit('status', `${user} has left the chat`)
        activeUsers.splice(activeUsers.indexOf(user),1);
        io.emit('userList', JSON.stringify(activeUsers));
    });
});

http.listen(3000, () => {
    console.log('Listening on Port 3000');
});