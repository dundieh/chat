const socket = io();

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $shareLocationButton = document.querySelector('#share-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMsgTemplate = document.querySelector('#locationMsg-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const autoscroll = () => {
    // new message element
    const $newMsg = $messages.lastElementChild;

    const newMsgStyles = getComputedStyle($newMsg);
    const newMsgMargin = parseInt(newMsgStyles.marginBottom);

    //new message height
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // message container height
    const containerHeight = $messages.scrollHeight;

    // how far scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMsgHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('locationMsg', (url) => {
    const html = Mustache.render(locationMsgTemplate, {
        url: url.text,
        createdAt: moment(url.createdAt).format('LT')
    });

    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

socket.on('msg', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt:  moment(msg.createdAt).format('LT'),
    });

    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');

    const msg = e.target.elements.message.value;
    socket.emit('sendMsg', msg, (err) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(err) {
            return console.log(err);
        }

        console.log('message sent successfully');
    });
});

$shareLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('geolocation is not supported');
    }

    $shareLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        $shareLocationButton.removeAttribute('disabled');

        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('location shared successfully');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href= '/';
    }
});