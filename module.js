// Adaptado a Moodle por Manuel Fernando M.A
// Gracias a @muazkh por su Contribucion:
// Muaz Khan     - MuazKhan.com
// MIT License   - WebRTC-Experiment.com/licence
// Documentation - RTCMultiConnection.org

    // inicializando el constructor
    var connection = new RTCMultiConnection();
    // conexion por firebase
    connection.firebase = false;
    // configuracion del tipo de conección de medios
    connection.session = {
        data: true,
        audio: false,
        video: false
    };
    // luego puedo invocar la recepcion de audio y video
    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };
    // Capturo el usuario de la sesion
    var username = userjs;
    // Capturo foto de perfil usuario
    var avatar = avatarjs;
    //  Grupo del usuario
    var grupo = currentgroupjs;
    // conversor de hora a hora 10:45 pm - 08:06 am
    // funcion para insertar el cero
    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }
    // funcion para convertir hora en 10:45
    function modHora(i) {
        if (i > 12){
            i = i - 12;
        }
        return i;
    }
    // funcion para insertar el am y pm
    var d = new Date();
    if (d.getHours() <= 12) {
        var H = "am";
        } else{
          var H = "pm";
    }
    
    // datos extra para compartir el nombre completo, img perfil, hora publicacion
    connection.extra = {
        username: username,
        imgPerfil: avatar,
        grupo: grupo
        //horaPublicacion: horaPublicacion
    };
    // Establecer algunos valores predeterminados
    connection.preventSSLAutoAllowed = false;
    connection.autoReDialOnFailure = true;
    connection.setDefaultEventsForMediaElement = false;
    connection.autoTranslateText = false;
    //var userMaxParticipantsAllowed = 8;
    //var maxParticipantsAllowed = 8;
    //var direction = 'many-to-many';
    // connection.direction = 'one-to-many';


/*ui.main*/
    function getElement(selector) {
    return document.querySelector(selector);
    }

    var main = getElement('.chat');
    // añadir los nuevos mensajes
    function addNewMessage(args) {
        var newMessageDIV = document.createElement('li');
        newMessageDIV.className = 'left clearfix';

        var userinfoDIV = document.createElement('div');
        userinfoDIV.className = 'user-info';
        userinfoDIV.innerHTML = args.userinfo || '<img src="pix/foto-perfil.jpg">';

        newMessageDIV.appendChild(userinfoDIV);

        var userActivityDIV = document.createElement('div');
        userActivityDIV.className = 'user-activity chat-body clearfix';

        userActivityDIV.innerHTML = '<strong class="primary-font">' + args.header + '</strong><small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>' + args.horaPublicacion + '</small>';
        
        var p = document.createElement('p');
        p.className = 'message content comment';
        userActivityDIV.appendChild(p);
        p.innerHTML = args.message;

        newMessageDIV.appendChild(userActivityDIV);

        main.insertBefore(newMessageDIV, main.firstChild);

        //userinfoDIV.style.height = newMessageDIV.clientHeight + 'px';

        if (args.callback) {
            args.callback(newMessageDIV);
        }

        document.querySelector('#message-sound').play();
    }
/* ui.users-list*/

    var numbersOfUsers = getElement('.numbers-of-users');

    numbersOfUsers.innerHTML = 1;


/* ui.peer-connection */

    function getUserinfo(blobURL, imageURL) {
        return blobURL ? '<video src="' + blobURL + '" autoplay controls></video>' : '<img src="' + imageURL + '">';
    }

    var isShiftKeyPressed = false;

    getElement('#chat-input').onkeydown = function(e) {
        if (e.keyCode == 16) {
            isShiftKeyPressed = true;
        }
    };

    var numberOfKeys = 0;
    getElement('#chat-input').onkeyup = function(e) {
        numberOfKeys++;
        if (numberOfKeys > 3) numberOfKeys = 0;

        if (!numberOfKeys) {
            if (e.keyCode == 8) {
                return connection.send({
                    stoppedTyping: true
                });
            }

            connection.send({
                typing: true
            });
        }

        if (isShiftKeyPressed) {
            if (e.keyCode == 16) {
                isShiftKeyPressed = false;
            }
            return;
        }


        if (e.keyCode != 13) return;

        addNewMessage({
            header: connection.extra.username,
            userinfo: connection.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: linkify(this.value)
        });

        connection.send(this.value);

        this.value = '';
    };
    // que sucede cuando habilitamos la camara
    getElement('#allow-webcam').onclick = function() {
        this.disabled = true;

        var session = { audio: true, video: true };

        connection.captureUserMedia(function(stream) {
            var streamid = connection.token();
            connection.customStreams[streamid] = stream;

            connection.sendMessage({
                hasCamera: true,
                streamid: streamid,
                session: session
            });
        }, session);
    };
    // que sucede cuando habilitamos la el microfono
    getElement('#allow-mic').onclick = function() {
        this.disabled = true;
        var session = { audio: true };

        connection.captureUserMedia(function(stream) {
            var streamid = connection.token();
            connection.customStreams[streamid] = stream;

            connection.sendMessage({
                hasMic: true,
                streamid: streamid,
                session: session
            });
        }, session);
    };
    // que sucede cuando compartimos la pantalla
    getElement('#allow-screen').onclick = function() {
        this.disabled = true;
        var session = { screen: true };

        connection.captureUserMedia(function(stream) {
            var streamid = connection.token();
            connection.customStreams[streamid] = stream;

            connection.sendMessage({
                hasScreen: true,
                streamid: streamid,
                session: session
            });
        }, session);
    };
    // que sucede cuando compartirmos archivos
    getElement('#share-files').onclick = function() {
        var file = document.createElement('input');
        file.type = 'file';

        file.onchange = function() {
            connection.send(this.files[0]);
        };
        fireClickEvent(file);
    };

    function fireClickEvent(element) {
        var evt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(evt);
    }
    // funcion para detectar tamaño archivos
    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // usamos websockets para la señalizacion
    // https://github.com/manueltato11/e-CTR-server
    var signalingserver = 'wss://e-ctr-server-websocket-over-nodejs-manueltato11.c9.io/';

    connection.openSignalingChannel = function(config) {
        channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
        var websocket = new WebSocket(signalingserver);
        websocket.channel = channel;

        websocket.onopen = function() {
            websocket.push(JSON.stringify({
                open: true,
                channel: channel
            }));
            if (config.callback)
                config.callback(websocket);
        };

        websocket.onmessage = function(event) {
            config.onmessage(JSON.parse(event.data));
        };
        websocket.push = websocket.send;
        websocket.send = function(data) {
            if (websocket.readyState != 1) {
                        return setTimeout(function() {
                            websocket.send(data);
                        }, 300); // up 1000
            }
                    
            websocket.push(JSON.stringify({
                data: data,
                channel: channel
            }));
        };
    };
    // use "channel" como sessionid para usar sessionid personalizado!
    var roomid = connection.channel;
    var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
    var websocket = new WebSocket(signalingserver);

    websocket.onmessage = function (event) {
        var URLactual = window.location;
        var data = JSON.parse(event.data);

        if (data.isChannelPresent == false) {
            connection.open(); // Abre la nueva sala
            console.log('Se ha abierto una nueva sala: ', connection.channel);
            addNewMessage({
                header: connection.extra.username,
                userinfo: connection.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: 'No hay usuarios conectados al chat. Abriendo el chat del grupo: <span class="badge">' + connection.extra.grupo + '</span> <br />Puede invitar a sus compañeros a unirse al chat. <span class="badge">' + URLactual + '</span>'
            });
        } else {
            connection.join(roomid); // Se une a sala existente
            console.log('Se ha unido a la sala existente: ', connection.channel);
            addNewMessage({
                header: connection.extra.username,
                userinfo: connection.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: 'Hay usuarios conectados al chat. Uniéndose al chat del grupo: <span class="badge">' + connection.extra.grupo + '</span>'
            });
        }
    };
    
    websocket.onopen = function () {
        websocket.send(JSON.stringify({
            checkPresence: true,
            channel: roomid
        }));
    };

    connection.customStreams = { };

    // cuando se habre la conexion
    connection.onopen = function(e) {
        getElement('#allow-webcam').disabled = false;
        getElement('#allow-mic').disabled = false;
        getElement('#share-files').disabled = false;
        getElement('#allow-screen').disabled = false;
        getElement('#chat-input').disabled = false;
        //getElement('.file').disabled = false;

        addNewMessage({
            header: e.extra.username,
            userinfo: e.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: 'La conexión de datos se ha establecido entre usted y <strong>' + e.extra.username + '</strong>.'
        });

        numbersOfUsers.innerHTML = parseInt(numbersOfUsers.innerHTML) + 1;
    };
    // evento para cada nuevo mensaje de datos
    connection.onmessage = function(e) {
        if (e.data.typing) {
            document.getElementById("chat-input").placeholder = e.extra.username + ' esta escribiendo ...';
            return;
        }

        if (e.data.stoppedTyping) {
            document.getElementById("chat-input").placeholder = 'Escriba su mensaje...';
            return;
        }
        document.getElementById("chat-input").placeholder = 'Escriba su mensaje...';

        addNewMessage({
            header: e.extra.username,
            userinfo: e.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: (connection.autoTranslateText ? linkify(e.data) + ' (' + linkify(e.original) + ')' : linkify(e.data))
        });
        document.title = e.data;

    };
    // evento para unirse a una sala con o sin  stream(s)
    var sessions = { };
    connection.onNewSession = function(session) {
        if (sessions[session.sessionid]) return;
        sessions[session.sessionid] = session;

        session.join();

        addNewMessage({
            header: session.extra.username,
            userinfo: session.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: 'Hacer apretón de manos con el propietario del chat...!'
        });
    };
    // evento se activa para cada nueva participacion o cada peticion
    connection.onRequest = function(request) {
        connection.accept(request);
        addNewMessage({
            header: 'Nuevo Participante!',
            userinfo: request.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: 'Se ha conectado al chat <strong>' + request.extra.username + '<span class="badge">' + request.userid + '</span>'
        });
    };
    // evento para mensajes personalizados
    connection.onCustomMessage = function(message) {
        if (message.hasCamera || message.hasScreen) {
            var msg = message.extra.username + ' compartió su cámara. <br /><button id="preview" class="btn btn-success btn-sm">Vista previa <span class="fa fa-desktop"></span></button>  <button id="share-your-cam" class="btn btn-success btn-sm">Compartir mi cámara <span class="fa fa-camera"></span></button>';

            if (message.hasScreen) {
                msg = message.extra.username + ' está dispuesto a compartir su pantalla. <br /><button id="preview" class="btn btn-success btn-sm">Ver su pantalla<span class="fa fa-desktop"></span></button>  <button id="share-your-cam" class="btn btn-success btn-sm">Compartir mi cámara <span class="fa fa-camera"></span></button>';
            }

            addNewMessage({
                header: message.extra.username,
                userinfo: message.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: msg,
                callback: function(div) {
                    div.querySelector('#preview').onclick = function() {
                        this.disabled = true;

                        message.session.oneway = true;
                        connection.sendMessage({
                            renegotiate: true,
                            streamid: message.streamid,
                            session: message.session
                        });
                    };

                    div.querySelector('#share-your-cam').onclick = function() {
                        this.disabled = true;

                        if (!message.hasScreen) {
                            session = { audio: true, video: true };

                            connection.captureUserMedia(function(stream) {
                                connection.renegotiatedSessions[JSON.stringify(session)] = {
                                    session: session,
                                    stream: stream
                                }
                            
                                connection.peers[message.userid].peer.connection.addStream(stream);
                                div.querySelector('#preview').onclick();
                            }, session);
                        }

                        if (message.hasScreen) {
                            var session = { screen: true };

                            connection.captureUserMedia(function(stream) {
                                connection.renegotiatedSessions[JSON.stringify(session)] = {
                                    session: session,
                                    stream: stream
                                }
                                connection.peers[message.userid].peer.connection.addStream(stream);
                                div.querySelector('#preview').onclick();
                            }, session);
                        }
                    };
                }
            });
        }

        if (message.hasMic) {
            addNewMessage({
                header: message.extra.username,
                userinfo: message.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: message.extra.username + ' compartió su micrófono. <br /><button id="listen" class="btn btn-success btn-sm">Escuchar <span class="fa fa-volume-up"></span></button>  <button id="share-your-mic" class="btn btn-success btn-sm">Compartir mi micrófono <span class="fa fa-microphone"></span></button>',
                callback: function(div) {
                    div.querySelector('#listen').onclick = function() {
                        this.disabled = true;
                        message.session.oneway = true;
                        connection.sendMessage({
                            renegotiate: true,
                            streamid: message.streamid,
                            session: message.session
                        });
                    };

                    div.querySelector('#share-your-mic').onclick = function() {
                        this.disabled = true;

                        var session = { audio: true };

                        connection.captureUserMedia(function(stream) {
                            connection.renegotiatedSessions[JSON.stringify(session)] = {
                                session: session,
                                stream: stream
                            }
                            
                            connection.peers[message.userid].peer.connection.addStream(stream);
                            div.querySelector('#listen').onclick();
                        }, session);
                    };
                }
            });
        }

        if (message.renegotiate) {
            var customStream = connection.customStreams[message.streamid];
            if (customStream) {
                connection.peers[message.userid].renegotiate(customStream, message.session);
            }
        }
    };

    connection.blobURLs = { };
    connection.onstream = function(e) {
        if (e.stream.getVideoTracks().length) {
            connection.blobURLs[e.userid] = e.blobURL;
            /*
            if( document.getElementById(e.userid) ) {
                document.getElementById(e.userid).muted = true;
            }
            */
            addNewMessage({
                header: e.extra.username,
                userinfo: e.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: e.extra.username + ' compartió su cámara <span class="fa fa-camera"></span>'
            });
        } else {
            addNewMessage({
                header: e.extra.username,
                userinfo: e.extra.imgPerfil,
                horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
                message: e.extra.username + ' compartió su micrófono <span class="fa fa-microphone"></span>'
            });
        }
        // contenedor de la llamada de video
        var videosContainer = document.getElementById('videos-container') || document.body;

        // botones de la llamado de voz y audio
        var buttons = ['mute-audio', 'mute-video', 'record-audio', 'record-video', 'full-screen', 'volume-slider', 'stop'];

        if (connection.session.audio && !connection.session.video) {
            buttons = ['mute-audio', 'full-screen', 'stop'];
        }

        var mediaElement = getMediaElement(e.mediaElement, {
            width: (videosContainer.clientWidth / 2) - 50,
            title: e.userid,
            buttons: buttons,
            onMuted: function(type) {
                connection.streams[e.streamid].mute({
                    audio: type == 'audio',
                    video: type == 'video'
                });
            },
            onUnMuted: function(type) {
                connection.streams[e.streamid].unmute({
                    audio: type == 'audio',
                    video: type == 'video'
                });
            },
            onRecordingStarted: function(type) {
                // www.RTCMultiConnection.org/docs/startRecording/
                connection.streams[e.streamid].startRecording({
                    audio: type == 'audio',
                    video: type == 'video'
                });
            },
            onRecordingStopped: function(type) {
                // www.RTCMultiConnection.org/docs/stopRecording/
                connection.streams[e.streamid].stopRecording(function(blob) {
                    if (blob.audio) connection.saveToDisk(blob.audio);
                    else if (blob.video) connection.saveToDisk(blob.video);
                    else connection.saveToDisk(blob);
                }, type);
            },
            onStopped: function() {
                connection.peers[e.userid].drop();
            }
        });

        videosContainer.insertBefore(mediaElement, videosContainer.firstChild);

        if (e.type == 'local') {
            mediaElement.media.muted = true;
            mediaElement.media.volume = 0;
        }
    };

    connection.onstreamended = function(e) {
        if (e.mediaElement.parentNode && e.mediaElement.parentNode.parentNode && e.mediaElement.parentNode.parentNode.parentNode) {
            e.mediaElement.parentNode.parentNode.parentNode.removeChild(e.mediaElement.parentNode.parentNode);
        }
    };

    connection.sendMessage = function(message) {
        message.userid = connection.userid;
        message.extra = connection.extra;
        connection.sendCustomMessage(message);
    };

    connection.onclose = connection.onleave = function(event) {
        addNewMessage({
            header: event.extra.username,
            userinfo: event.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: event.extra.username + ' ha abandonado el chat!'
        });
    };


/*ui.share-files*/
    // file sharing
    var progressHelper = { };
    connection.onFileStart = function(file) {
        addNewMessage({
            header: connection.extra.username,
            userinfo: connection.extra.imgPerfil,
            horaPublicacion: addZero(modHora(new Date().getHours())) + ':' + addZero(new Date().getMinutes()) + ' ' + H,
            message: '<strong>' + file.name + '</strong> ( ' + bytesToSize(file.size) + ' )',
            callback: function(div) {
                var innerDiv = document.createElement('div');
                innerDiv.title = file.name;
                innerDiv.innerHTML = '<label>0%</label><progress></progress>';
                div.querySelector('.message').appendChild(innerDiv);
                progressHelper[file.uuid] = {
                    div: innerDiv,
                    progress: innerDiv.querySelector('progress'),
                    label: innerDiv.querySelector('label')
                };
                progressHelper[file.uuid].progress.max = file.maxChunks;
            }
        });
    };
    connection.onFileProgress = function(chunk) {
        var helper = progressHelper[chunk.uuid];
        helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
        updateLabel(helper.progress, helper.label);
    };

    // www.connection.org/docs/onFileEnd/
    connection.onFileEnd = function(file) {
        var helper = progressHelper[file.uuid];
        if (!helper) {
            console.error('No existe tal elemento en el asistente de progreso.', file);
            return;
        }
        var div = helper.div;
        if (file.type.indexOf('image') != -1) {
            div.innerHTML = '<a class="content" href="' + file.url + '" download="' + file.name + '">Descargar <strong style="color:#337ab7;" class="primary-font">' + file.name + '</strong> </a><br /><img src="' + file.url + '" title="' + file.name + '" style="max-width: 100%; padding-top: 5px;" class="img-rounded"> <!-- END hat-body clearfix-->';
        } else {
            div.innerHTML = '<a class="content" href="' + file.url + '" download="' + file.name + '">Descargar <strong style="color:#337ab7;" class="primary-font">' + file.name + '</strong> </a><br /><iframe src="' + file.url + '" title="' + file.name + '" style="width: 100%;border: 0;height: inherit;margin-top:1em;" class="img-rounded"></iframe> <!-- END hat-body clearfix-->';
        }
    };

    function updateLabel(progress, label) {
        if (progress.position == -1) return;
        var position = +progress.position.toFixed(2).split('.')[1] || 100;
        label.innerHTML = position + '%';
    }

/* ui.settings*/
    var settingsPanel = getElement('.settings-panel');
        getElement('#settings').onclick = function() {
        settingsPanel.style.display = 'block';
    };

    getElement('#save-settings').onclick = function() {
        settingsPanel.style.display = 'none';

        if (!!getElement('#autoTranslateText').checked) {
            connection.autoTranslateText = true;
            connection.language = getElement('#language').value;
        } else connection.autoTranslateText = false;

        connection.bandwidth.audio = getElement('#audio-bandwidth').value;
        connection.bandwidth.video = getElement('#video-bandwidth').value;

        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: !!getElement('#OfferToReceiveAudio').checked,
            OfferToReceiveVideo: !!getElement('#OfferToReceiveVideo').checked,
            IceRestart: !!getElement('#IceRestart').checked
        };

        var videWidth = getElement('#video-width').value;
        var videHeight = getElement('#video-height').value;
        connection.mediaConstraints.mandatory = {
            minWidth: videWidth,
            maxWidth: videWidth,
            minHeight: videHeight,
            maxHeight: videHeight
        };

        connection.preferSCTP = !!getElement('#prefer-sctp').checked;
        connection.chunkSize = +getElement('#chunk-size').value;
        connection.chunkInterval = +getElement('#chunk-interval').value;

        window.skipconnectionLogs = !!getElement('#skip-connection-Logs').checked;

        //connection.selectDevices(getElement('#audio-devices').value, getElement('#video-devices').value);
        connection.maxParticipantsAllowed = getElement('#max-participants-allowed').value;
        connection.candidates = {
            relay: getElement('#prefer-stun').checked,
            reflexive: getElement('#prefer-turn').checked,
            host: getElement('#prefer-host').checked
        };

        connection.dataChannelDict = eval('(' + getElement('#dataChannelDict').value + ')');

        if (!!getElement('#fake-pee-connection').checked) {
            // http://www.connection.org/docs/fakeDataChannels/
            connection.fakeDataChannels = true;
            connection.session = { };
        }
        ;
    };

    var audioDeviecs = getElement('#audio-devices');
    var videoDeviecs = getElement('#video-devices');

    connection.getDevices(function(devices) {
        for (var device in devices) {
            device = devices[device];
            appendDevice(device);
        }
    });

    function appendDevice(device) {
        var option = document.createElement('option');
        option.value = device.id;
        option.innerHTML = device.label || device.id;
        if (device.kind == 'audio') {
            audioDeviecs.appendChild(option);
        } else videoDeviecs.appendChild(option);
    }