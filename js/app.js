/* 
 *  Web Notification Demo
 *  Realtime web notification demo that lets you send "Oi!" message to random people onpline
 *  https://github.com/girliemac/oi-web-notification
 * 
 *  @girlie_mac
 *  License: MIT
 */

(function() {
    'use strict';

    var channel = 'oi-demo';
    var username = '';
    var pubnub = null;
    //var users = [];
    var input = document.querySelector('[type=text]');
    var intro = document.querySelector('.intro');
    var list = document.querySelector('.list');


    function displayIntro() {
        input.style.display = 'none';
        intro.textContent = username.toUpperCase() + ', click available people below to send Oi!';
        intro.style.display = 'inline-block';
    }

    function askUserInfo() {
        input.style.display = 'inline-block';
        intro.style.display = 'none';
    }

    function setUserInfo(e) {
        if((e.keyCode || e.charCode) !== 13) return;
        if(!input.value) return;

        username = input.value;

        localStorage.setItem('oi-username', username);
        getUserInfo();
    }

    function showNotification(data) {
        var ms = 30000; // close notification after 30sec
        var notification = new Notification('Hello', {
                body: 'From: ' + data.from,
                tag: channel,
                icon: 'images/oi.png'
            });
        notification.onshow = function() { 
            setTimeout(notification.close, ms); 
        };
    }

    async function connect(uuid) {
        pubnub = new PubNub({
            subscribeKey: 'demo',
            publishKey:   'demo',
            userId: uuid
        });

        await pubnub.addListener({
            status: async statusEvent => {
            },
            message: payload =>
            {
                if(payload.message.to === username) {
                    // Show a notification
                    showNotification(payload.message);
                }
            },
            presence: payload =>
            {
                updateList(payload);
            }
        })
        
        await pubnub.subscribe({
            channels: [channel],
            withPresence: true
        });

        var users = await hereNow();
        updateList(users);

        list.addEventListener('click', function(e){
            if(!e.target.id) return;

            e.target.className = 'icon-oi';
            window.setTimeout(function(){
                e.target.className = '';
            }, 3000);

            pubnub.publish({
                channel : channel, 
                message : {"from": username, "to": e.target.id}, 
            });
        }, false);
    }

    async function hereNow() {
        var users = await pubnub.hereNow({
            channels: [channel]
        });
        return users
    };

    function updateList(m) {
        var foundSelf = false;
        var str = '';
        for (var i = 0; i < m.channels[channel].occupants.length; i++)
        {
            var u = m.channels[channel].occupants[i];
            var n = u.uuid;
            if(u.uuid === username) {
                foundSelf = true;
                n = u.uuid + ' (You)';
            }
            if(u.uuid.length > 35) {
                n = 'PubNub Admin';
            }
            str += '<li id="' + u.uuid + '">' + u.uuid + '</li>';
        }
        list.innerHTML = str;

        if (!foundSelf) { // If the results doesn't include self, try again.
            updateList();
        }
    }

    function getUserInfo() {
        if(localStorage.getItem('oi-username')) {
            username = localStorage.getItem('oi-username');
            displayIntro();
            connect(username);
        } else {
            askUserInfo();
        }
    }
    

    // Web Notification feature detection
    if (!window.Notification) { 
        alert('Your browser does not support Web Notifications API.');
        return;  
    } 

    // Web Notification permission
    Notification.requestPermission(function() {
        if(Notification.permission !== 'granted') {
            alert('Please allow Web Notifications feature to try this demo.');
            return;
        }
    });

    getUserInfo();

    input.addEventListener('keyup', setUserInfo, false);
})();