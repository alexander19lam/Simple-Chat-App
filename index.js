const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Managing usernames
let usedUsers = [];
let availUsers = ["Danyell","Marjory","Nereida","Madie","Shavonda","Lucrecia","Dina","Jarvis","Paris","Euna","Michaela","Stefanie","Herminia","Arla","Rolland","Preston","Johnsie","Sunday","Alisia","Allyn"]

// Connected Users
let activeUsers = [];

let messageLog = [];

function styleName({username, color}){
    return `<span style='color:${color}'>${username}</span>`;
}

// Serving Public Folder for Scripts
app.use(express.static('public'));

// If default page is requested, server index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// On Socket IO connection
io.on('connection', (socket) => {
    // Checking if user exist and assigning name
    const cookie = socket.client.request.headers.cookie;
    const userCookie =  cookie && cookie.split(';').find(cookie => cookie.includes('user='));
    const username = userCookie && userCookie.split('=')[1];
    let user = {username, color : '#000000'};
    
    // If there are users, Add it to the list
    if (username){
        // user = usedUsers.find(entry => entry.username == username);
        const oldUser = usedUsers.find(entry => entry.username == username);
        user = oldUser ? oldUser : user;
        
        // Only add to active user if he is not there
        if (!activeUsers.includes(user)){
            activeUsers.push(user);
        }
        socket.emit('setUser', user);
    }
    else{
        // Generating new name for the user
        user.username = availUsers[Math.floor(Math.random()*availUsers.length)];
        usedUsers.push(user);
        // Removing it from list of possible users
        availUsers.splice(availUsers.indexOf(user.username),1);
        activeUsers.push(user);
        socket.emit('setUser',user);
    }

    // Letting people know who connected
    socket.broadcast.emit('status', `${styleName(user)} has joined the chat`);

    // Updating userlist
    io.emit('userList', activeUsers);

    // Sending the Chat History
    socket.emit('history', messageLog);

    // Letting User know who they are
    socket.emit('status', `Welcome to the chat, you are ${styleName(user)}`);

    // Sending Messages
    socket.on('message', msg => {
        const message = {date : new Date(), ...msg};
        messageLog.push(message);
        io.emit('message', message);
    });

    // Changing Nickname
    socket.on('nickname', name => {
        if(activeUsers.find( user => user.username === name)){
            socket.emit('status', 'Name in use. Your name was not changed.')
        }else if(name === ''){
            socket.emit('status', 'Name cannot be empty. Your name was not changed.')
        }else{
            const updatedUser = {username: name, color: user.color};
            socket.emit('status', `Your name has been changed to ${styleName(updatedUser)}`);
            socket.broadcast.emit('status', `${styleName(user)} has changed their name to ${styleName(updatedUser)}`);
            user.username = name;
            socket.emit('setUser', user);
            io.emit('userList', activeUsers);
        }        
    });

    // Changing Color
    socket.on('color', color => {
        socket.emit('status', `Your username color has been changed: 
                                <span style='color:${user.color}'>${user.color}</span> -> <span style='color:#${color}'>#${color}</span>`);
        user.color = `#${color}`;
        socket.emit('setUser', user);
        io.emit('userList', activeUsers);
    });
    
    // On Disconnect
    socket.on('disconnect', () => {
        socket.broadcast.emit('status', `${styleName(user)} has left the chat`)
        activeUsers.splice(activeUsers.indexOf(user),1);
        io.emit('userList', activeUsers);
    });
});

http.listen(3000, () => {
    console.log('Listening on Port 3000');
});