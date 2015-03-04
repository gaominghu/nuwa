var Fiber = Meteor.npmRequire('fibers'),
  io,
  fs = Meteor.npmRequire('fs'),
  pathHelper = Meteor.npmRequire('path'),
  request = Meteor.npmRequire('request'),
  mkdirp = Meteor.npmRequire('mkdirp'),
  gm = Meteor.npmRequire('gm'),
  saveCount = 0,
  album = '',
  maxSave = Meteor.settings.maxImageNumber,
  shouldSave = false,
  timeoutHandler = '',
  timeoutDuration = 1000 * 20,
  tempPath = '',
  base = fs.realpathSync('.');

var zeroPad = function (str, max) {
  str = str.toString();
  return str.length < max ? zeroPad("0" + str, max) : str;
}


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
    console.log('socket.io: connection from: ', socket.client.conn.remoteAddress);
    saveOrUpdateSocketState(socket, true);

    socket.on('image-saved', function(data) {
      if (Meteor.settings.composition.default === "assembly") {
        Fiber(function() {
          var album_name = data.src.match(/snap-\d{10}/g);
          if (saveCount === maxSave - 1) {
            shouldSave = true;
          }
          if (saveCount >= maxSave) {
            saveCount = 0;
            shouldSave = false;
          }
          if (saveCount === 0) {
            tempPath = pathHelper.join(process.env.PWD, '.temp');
            album = (album_name) ? album_name : Date.now()
            //console.log('album: ', album);
            tempPath = pathHelper.join(tempPath, album.toString());
            mkdirp.sync(tempPath);
          }

          data.album_name = album;
          var number = (data.src.indexOf('snap') >= 0) ? getNumber(data.src) : getNumber();
          data.number = number;

          var  filename = pathHelper.join(tempPath, zeroPad(number, 4) + '.jpg'),
            tempfile = fs.createWriteStream(filename);

          tempfile.on('error', function(err) {
            console.error('error on tempfile: ', err);
          });

          tempfile.on('close', function() {
            if (shouldSave) {
              Fiber(function() {
                Meteor.call('ffmpeg', 'assembly', pathHelper.dirname(filename), function(error, result) {
                  if (error) {
                    console.log('ffmpeg - Error: ', error);
                  } else {
                    console.log('ffmpeg - Result: ', result);
                  }
                });
              }).run();
            }
          });

          request({
            url: data.src,
            encoding: null
          }).pipe(tempfile);


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

          Meteor.clearTimeout(timeoutHandler);
          timeoutHandler = Meteor.setTimeout(function() {
            saveCount = 0;
            console.log('socket.io - reset count...');
          }, timeoutDuration);
          console.log('new file:', data);
          saveCount++;
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

var getNumber = function(fullurl) {
    //var url = require('url');
    //var pathname = url.pathname(fullurl).split('/').pop();
    //here we should finalize the treatment :)
    ///var nb = (fullurl.replace(Meteor.settings.machine.name, '').fullurl(Meteor.settings.machine.extension, ''));
    var match = fullurl.match(/snap-\d{10}-(\d*)/);
    if ( match && match.length > 1) {
      var nb = match[1];
      if (nb === '') {
        nb = -1;
      } else {
        nb = Number(nb);
        if (nb === NaN) {
          nb = -1
        }
      }
      return nb;
    }
    else {
      return saveCount;
    }
}

var saveFile = function(data, response, buffer) {
  var order = data.number,
    newFile = new FS.File();
  //Hacks while testing on localmachine
  if (order < 0) {
    order = saveCount;
  }
  console.log(order);

  newFile.attachData(buffer, {
    type: 'image/jpg'
  }, function(error) {
      if (error)
        throw error;
      newFile.name(data.src.split('/').pop());
      //newFile.album = data.src.match(/snap-\d{10}/g);
      newFile.album = data.album_name;
      newFile.order = order;
      Images.insert(newFile);
    });
}

var saveOrUpdateSocketState = function(socket, state) {
  // the socket.handshake.headers.host is the one from the server not the client :/
  // need to find a better solution...
  if (!Meteor.settings.simulateConnection) {
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
        }, function(err, modifiedDoc) {
          updateMaxImageNumber();
        });

      console.log('socket.io - ', socket.handshake.headers, ' - state: ', state);
    }).run();
  }
}

var updateMaxImageNumber = function() {
  Fiber(function() {
    maxSave = Socket.find({
      connected: true
    }).count();
    console.log('socket.io - maxNumber: ', maxSave);
  }).run()
}

initSocket();
