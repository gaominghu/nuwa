var Fiber = Meteor.npmRequire('fibers'),
  io,
  fs = Meteor.npmRequire('fs'),
  request = Meteor.npmRequire('request'),
  mkdirp = Meteor.npmRequire('mkdirp'),
  saveCount = 0,
  album = '',
  maxSave = 64,
  timeoutHandler = '',
  timeoutDuration = 1000 * 20;
base = fs.realpathSync('.');
//if address already in use, it throw an error.

var initSocket = function() {
  Socket.update({}, {
    $set: {
      connected: false
    }
  }, {
    multi: true
  });
  io = Meteor.npmRequire('socket.io')(Meteor.settings.service.port);
  io.on('connection', function(socket) {
    console.log('socket.io: Connected !');
    saveOrUpdateSocketState(socket, true);
    socket.on('image-saved', function(data) {
        Fiber(function() {
          if (saveCount === 0) {
            album = Date.now();
            request.get({
              url: data.src,
              encoding: null
            }, Meteor.bindEnvironment(function(e, r, buffer) {
              if (e) {
                console.log('err on request', e)
              } else {
                saveFile(data, r, buffer);
              }
            }));
          } else if (saveCount < maxSave) {
            request.get({
              url: data.src,
              encoding: null
            }, Meteor.bindEnvironment(function(e, r, buffer) {
              if (e) {
                console.log('err on request', e)
              } else {
                saveFile(data, r, buffer);
              }
            }));
          } else {
            saveCount = 0;
          }
          Meteor.clearTimeout(timeoutHandler);
          timeoutHandler = Meteor.setTimeout(function() {
            saveCount = 0;
          }, timeoutDuration);
          console.log('new file:', data);
        }).run();
      })
      .on('disconnect', function() {
        saveOrUpdateSocketState(socket, false);
      });
  });
}

var getNumber = function(name) {
  var nb = (name.replace(Meteor.settings.machine.name, '').replace(Meteor.settings.machine.extension, ''));

  if (nb === '') {
    nb = -1;
  } else {
    nb = Number(nb);
    if (nb === NaN) {
      nb = -1
    }
  }
  return (nb);
}

var saveFile = function(data, response, buffer) {
  var order = getNumber(response.request.uri.hostname),
    newFile = new FS.File();
  //Hacks while testing on localmachine
  if (order < 0) {
    order = saveCount;
  }
  newFile.attachData(buffer, {
    type: 'image/jpg'
  }, function(error) {
    if (error) throw error;
    newFile.name(data.src.split('/').pop());
    newFile.album = album;
    newFile.order = order;
    Images.insert(newFile);
  });
  saveCount++;
}

var saveOrUpdateSocketState = function(socket, state) {
  // the socket.handshake.headers.host is the one from the server not the client :/
  // need to find a better solution...
  
  Fiber(function() {
    //console.log(socket.handshake);
    Socket.upsert({
      address: socket.handshake.address
    }, {
      $set: {
        address: socket.handshake.address,
        time: socket.handshake.time,
        connected: state,
        host: socket.handshake.headers.host
      }
    })
    console.log('state: ', state);
    updateMaxImageNumber();
  }).run();
}

var updateMaxImageNumber = function() {
  Fiber(function() {
    maxSave = Socket.find({
      connected: true
    }).count();
    console.log(maxSave);
  }).run()
}

initSocket();