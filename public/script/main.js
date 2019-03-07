let currentUser, socket = io();
    
    function updateScroll() {
        const element = document.querySelector('#messages');
        element.scrollTop = element.scrollHeight;
    }

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

    window.onload = () => {
        document.querySelector('#controls').addEventListener('submit', event => {
            event.preventDefault();
            const field = document.querySelector('#data');
            const [command, ...message] = field.value.split(' ');
            if (command === '/nickcolor'){
                socket.emit('color', message.join(' '));
            }
            else if (command === '/nick'){
                socket.emit('nickname', message.join(' '));
            } 
            else {
                field.value && socket.emit('message',{user: currentUser, message: field.value});
            }
            field.value = '';

        });
    };

    socket.on('setUser', user => {
        document.cookie = `user=${user.username}`;
        document.querySelector('#userID').innerHTML = user.username;
        currentUser = user;
    })

    socket.on('history', history => {
        history.forEach(message => {
            document.querySelector('#messages').innerHTML += formatMessage(message);
        });
        updateScroll();
    });

    socket.on('userList', userlist => {
        document.querySelector('#users').innerHTML = '';
        userlist.forEach(({username, color}) => {
            document.querySelector('#users').innerHTML += `<b><p style='color:${color}'>${username}</p></b>`;
        });
    });
    
    socket.on('status', msg => {
        document.querySelector('#messages').innerHTML += `<p style='color:orange'><i>${msg}</i></p>`;
        updateScroll();
    });

    socket.on('message', msg => {
        document.querySelector('#messages').innerHTML += formatMessage(msg);
        updateScroll();
    });