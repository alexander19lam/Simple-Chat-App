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
    const userExist =  cookie && cookie.split(';').find(cookie => cookie.includes('user='));
    
    if (!userExist){
        const newUser = availUsers[Math.floor(Math.random()*availUsers.length)];
        usedUsers.push(newUser);
        availUsers.splice(availUsers.indexOf(newUser),1);
        socket.emit('setUser',newUser);
        activeUsers.push(`<p>${newUser}</p>`);
    }
    else{
        const newUser = `<p>${userExist.split('=')[1].trim()}</p>`;
        !activeUsers.includes(newUser) && activeUsers.push(newUser);
    }
    io.emit('userList', JSON.stringify(activeUsers));

    // Sending the Chat History
    socket.emit('history', JSON.stringify(messageLog));

    // Sending Messages
    socket.on('message', msg => {
        let message = `<p>${getTime()} ${msg}</p>`;
        messageLog.push(message);
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});



http.listen(3000, () => {
    console.log('Listening on Port 3000');
});