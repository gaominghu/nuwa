var Fiber = Meteor.npmRequire('fibers'),
  io = Meteor.npmRequire('socket.io')(Meteor.settings.service.port),
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

var getNumber = function(name) {
  var nb = (name.replace(Meteor.settings.machine.name, '').replace(Meteor.settings.machine.extension, ''));

  if (nb === '') {
    nb = -1;
  } else {
    nb = Number(nb);
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

io.on('connection', function(socket) {
  console.log('socket.io: Connected !');
  socket.on('image-saved', function(data) {
    Fiber(function() {
      if (saveCount == 0) {
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
  });
});