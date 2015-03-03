var Fiber = Meteor.npmRequire('fibers'),
  io,
  fs = Meteor.npmRequire('fs'),
  request = Meteor.npmRequire('request'),
  mkdirp = Meteor.npmRequire('mkdirp'),
  gm = Meteor.npmRequire('gm');
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
      if (Meteor.settings.composition.default === "assembly") {
        Fiber(function() {
          if (saveCount > maxSave) {
            saveCount = 0;
          }
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
      } else if (Meteor.settings.composition.default === "video-layer") {

        var filename = process.env.PWD + '/temp/temp_' + Date.now() + '.jpg';
        var tempfile = fs.createWriteStream(filename);
        tempfile.on('error', function(err) {
          console.log('error on tempfile: ', err);
          //fileObj.emit('Can not open this folder.');
          //return 'error on tempfile: ' + err
        });
        request({
          url: data.src,
          encoding: null
        }).pipe(tempfile);
        tempfile.on('close', function() {
          Fiber(function() {
            try {
              var GMimages = gm(filename).gravity('Center'),
                synchThumb = Meteor.wrapAsync(GMimages.thumb, GMimages);
              var res = synchThumb(640, 360, filename, 100);
            } catch (ex) {
              console.log('error with gm:', ex);
            }
            Meteor.call('ffmpeg', "custom", filename, function(error, result) {
              if (error) {
                console.log('ffmpeg - Error: ', error);
              } else {
                console.log('ffmpeg - Result: ', result);
              }
            });
          }).run();
        });
      }
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

  // Check if this is the last file (should get as much as connected session)
  // Save the file in temp folder and process the video with ffmpeg command
  // Then save the files and the video

  newFile.attachData(buffer, {
    type: 'image/jpg'
  }, function(error) {
    if (error) throw error;
    newFile.name(data.src.split('/').pop());
    newFile.album = data.src.match(/snap-\d{10}/g);
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
