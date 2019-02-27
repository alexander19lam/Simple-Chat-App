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
    const username = userCookie && userCookie.split('=')[1];
    let user = {username, color : '#000000'};
    
    // If there are users, Add it to the list
    if (username){
        const activeUser = activeUsers.find(entry => entry.username == username);
        // Only add to active user if he is not there
        if (activeUser){
            user = activeUser;
        }
        else{
            activeUsers.push(user);
        }
        socket.emit('setUser', user);
    }
    else{
        // Generating new name for the user
        user.username = availUsers[Math.floor(Math.random()*availUsers.length)];
        usedUsers.push(user.username);
        // Removing it from list of possible users
        availUsers.splice(availUsers.indexOf(user.username),1);
        activeUsers.push(user);
        socket.emit('setUser',user);
    }

    // Letting people know who connected
    socket.broadcast.emit('status', `${user.username} has joined the chat`);

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

    // Changing Nickname
    socket.on('nickname', name => {
        if(activeUsers.find(user => user.username === name)){
            socket.emit('status', 'Name in use. Your name was not changed.')
        }else{
            socket.emit('status', `Your name has been changed to ${name}`);
            socket.broadcast.emit('status', `${user.username} has changed his name to ${name}`);
            user.username = name;
            socket.emit('setUser', user);
            io.emit('userList', JSON.stringify(activeUsers));
        }        
    });

    // Changing Color
    socket.on('color', color => {
        socket.emit('status', `Your username color has been changed: 
                                <span style='color:${user.color}'>${user.color}</span> -> <span style='color:#${color}'>#${color}</span>`);
        user.color = `#${color}`;
        socket.emit('setUser', user);
        io.emit('userList', JSON.stringify(activeUsers));
    });
    
    // On Disconnect
    socket.on('disconnect', () => {
        socket.broadcast.emit('status', `${user.username} has left the chat`)
        activeUsers.splice(activeUsers.indexOf(user),1);
        io.emit('userList', JSON.stringify(activeUsers));
    });
});

http.listen(3000, () => {
    console.log('Listening on Port 3000');
});