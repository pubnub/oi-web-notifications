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
        var notification = new Notification(data.message || 'Oi!', {
                body: 'From: ' + data.from,
                tag: channel,
                icon: 'images/oi.png'
            });
        notification.onshow = function() { 
            setTimeout(notification.close, ms); 
        };
    }

    function connect(uuid) {
        var pubnub = PUBNUB.init({
            subscribe_key: 'sub-c-f762fb78-2724-11e4-a4df-02ee2ddab7fe',
            publish_key:   'pub-c-156a6d5f-22bd-4a13-848d-b5b4d4b36695',
            uuid: uuid
        });

        var updateList = function() {
            pubnub.here_now({
                channel: channel,
                callback: function(m){
                    var foundSelf = false;
                    var str = '';
                    [].forEach.call(m.uuids, function(u) {
                        var n = u;
                        if(u === uuid) {
                            foundSelf = true;
                            n = u + ' (You)';
                        }
                        if(u.length > 35) {
                            n = 'PubNub Admin';
                        }
                        str += '<li id="' + u + '">' + n + '</li>';
                    });
                    list.innerHTML = str;

                    if (!foundSelf) { // If the results doesn't include self, try again.
                        updateList();
                    }
                }
            });
        };

        pubnub.subscribe({
            channel: channel,
            callback: function(m) { 
                console.log(m);
                if(m.to === username) {
                    // Show a notification
                    showNotification(m);
                }
            },
            presence: updateList
        });

        list.addEventListener('click', function(e){
            if(!e.target.id) return;

            e.target.className = 'icon-oi';
            window.setTimeout(function(){
                e.target.className = '';
            }, 3000);

            pubnub.publish({
                channel : channel, 
                message : {from: username, to: e.target.id}, 
            });
        }, false);
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