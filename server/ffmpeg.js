var _ = Meteor.npmRequire('lodash'),
  pathHelper = Meteor.npmRequire('path'),
  fs = Meteor.npmRequire('fs.extra'),
 stream = Meteor.npmRequire("stream"),

  videoLayer = function(media, resolveCallback) {

    var param = _.findWhere(Meteor.settings.composition.effect, {
        name: 'video-layer'
      }),
      videoCodec = 'libx264', //mpeg4
      bitrate = 12000,
      outputOptions = [
        '-movflags +faststart',
        '-threads 0',
        '-b:v ' + bitrate + 'k',
        '-maxrate ' + bitrate + 'k',
        '-bufsize ' + 2 * bitrate + 'k',
        '-preset ultrafast',
      ];

    console.log('found param:', param);
    //console.log(media);
    console.log('media:', typeof media);
    //Could be improved
    /*console.log(Buffer.isBuffer(media));
    if(typeof media !== 'string'){
      //var bufferStream = new stream.Transform();
      var buffer = new Buffer( media );
      var bufferStream = new stream.PassThrough();
      bufferStream.end( buffer );
      media = bufferStream;
      //bufferStream.push(media);
      //media = bufferStream;
    }*/

    var basepath = pathHelper.join(process.env.PWD, 'projects', param.type);
    //would be nice to use : 'crop=640:360:0:0'
    var filenameTmp = pathHelper.join(process.env.PWD, 'temp','temp_' + Date.now() + '.mp4');
    var command = ffmpeg()
      .addInput(media)
      .inputOptions('-loop 1')
      .addInput(pathHelper.join(basepath, param.source, param.basename));

      if(Meteor.settings.composition.audio){
        command.addInput(pathHelper.join(basepath, param.source, 'audio.mp3'))
      }

      command
      .complexFilter(['overlay=shortest=1'])
      .videoCodec(videoCodec)
      .outputOptions(outputOptions)
      .on('error', function(err) {
        console.log('An error occurred whiile merging: ', err);
        //throw new Meteor.Error( 500, 'There was an error processing sound.' );
        resolveCallback(new Error('An error occurred whiile merging: ', err));
      })
      .on('progress', function(progress) {
        var date = Date();
        console.log(date.substr(16, date.length) + ' - Processing generation');
      })
      .on('end', function() {
        console.log('ffmpeg - finished to layer images');
        //fs.renameSync(filenameTmp, pathHelper.join(Meteor.settings.destinationPath, 'video_'+Date.now()+'.mp4'));
        //lets cleanup the mess
        //fs.unlinkSync(filenameTmp);

        fs.move(filenameTmp, pathHelper.join(Meteor.settings.destinationPath, 'video_'+Date.now()+'.mp4'), function (err) {
          if (err) {
            throw err;
          } else {
            console.log(pathHelper.join(Meteor.settings.destinationPath, 'video_'+Date.now()+'.mp4') +' has been created.');
          }
        });
        fs.unlinkSync(media);
        resolveCallback(null, 'ffmpeg - finished to layer images');
      })
      .save(filenameTmp);
  };

Meteor.methods({
  ffmpeg: function(effect, media) {
    switch (effect) {
      case 'video-layer':
        console.log('ffmpeg - video-layer');
        videoLayer(media);
        break;
      case 'assembly':
        console.log('ffmpeg - assembly');
        break;
      default:
        console.log('ffmpeg - ', Meteor.settings.composition.default);
        var syncFunc = Meteor.wrapAsync(videoLayer);
        var result;
        try {
          result = syncFunc(media);
        } catch (err) {
          console.log("ffmpeg : " + err);
        } finally {
          return result;
      }
    }
  }
});