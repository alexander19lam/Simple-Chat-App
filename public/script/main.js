// Defining variables to keep socket and user
let currentUser, socket = io();
    
// Function to align scroll bar at the bottom
function updateScroll() {
    const element = document.querySelector('#messages');
    element.scrollTop = element.scrollHeight;
}

// Function to format message from the server for display
function formatMessage({date, user : {username, color}, message}){
    // Function to compensate for missing 0 in minutes and hour
    function correctTime(time){
        return time > 9 ? time : `0${time}`;
    }
    const time = new Date(date);
    const styledUser = `<span style='color:${color}'>${username}</span>`;
    const styledMessage = `[${correctTime(time.getHours())}:${correctTime(time.getMinutes())}] ${styledUser}: ${message}`
    return username == currentUser.username ? `<p><b>${styledMessage}</b></p>` : `<p>${styledMessage}</p>`;
}

// Change the submit functionality of the form once the page has been loaded
window.onload = () => {
    document.querySelector('#controls').addEventListener('submit', event => {
        // Prevent page from reloading
        event.preventDefault();
        // Getting the field value and checking if there is a command
        const field = document.querySelector('#data');
        const [command, ...message] = field.value.split(' ');
        if (command === '/nickcolor'){
            // Tell the server to change nickname color based on everything after the command
            socket.emit('color', message.join(' '));
        }
        else if (command === '/nick'){
            // Tell the server to change nickkname based on everyting after the command
            socket.emit('nickname', message.join(' '));
        } 
        else {
            // If field value is not empty, send the message
            field.value && socket.emit('message',{user: currentUser, message: field.value});
        }
        // Clearing the message after sent
        field.value = '';
    });
};

// Watch update from server on the user's username
socket.on('setUser', user => {
    document.cookie = `user=${user.username}`;
    document.querySelector('#userID').innerHTML = user.username;
    currentUser = user;
})

// Load the history of previous chatted messages
socket.on('history', history => {
    history.forEach(message => {
        document.querySelector('#messages').innerHTML += formatMessage(message);
    });
    updateScroll();
});

// Watch the server for update to the user list
socket.on('userList', userlist => {
    document.querySelector('#users').innerHTML = '';
    userlist.forEach(({username, color}) => {
        document.querySelector('#users').innerHTML += `<b><p style='color:${color}'>${username}</p></b>`;
    });
});

// Wath the server for update on status messages
socket.on('status', msg => {
    document.querySelector('#messages').innerHTML += `<p style='color:orange'><i>${msg}</i></p>`;
    updateScroll();
});

// Getting messages from the server
socket.on('message', msg => {
    document.querySelector('#messages').innerHTML += formatMessage(msg);
    updateScroll();
});