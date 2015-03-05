var _ = Meteor.npmRequire('lodash'),
  pathHelper = Meteor.npmRequire('path'),
  fs = Meteor.npmRequire('fs.extra'),
  stream = Meteor.npmRequire("stream"),
  videoCodec = 'libx264', //mpeg4
  //videoCodec = 'mpeg4', //mpeg4
  bitrate = Meteor.settings.output.bitrate,
  outputOptions = [
    '-movflags +faststart',
    '-threads 0',
    //'-vcodec ' + bitrate + 'k',
    '-maxrate ' + bitrate + 'k',
    '-bufsize ' + 2 * bitrate + 'k'
  ];

effectList = {
  'videoLayer': function(media, resolveCallback) {

    var param = _.findWhere(Meteor.settings.composition.effect, {
      name: 'video-layer'
    });

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
    var filenameTmp = pathHelper.join(process.env.PWD, 'temp', 'temp_' + Date.now() + '.mp4');
    var command = ffmpeg()
      .addInput(media)
      .inputOptions('-loop 1')
      .addInput(pathHelper.join(basepath, param.source, param.basename));

    //add audio should be a post process as we might need it frequently
    if (Meteor.settings.composition.audio) {
      command.addInput(pathHelper.join(basepath, param.source, 'audio.mp3'))
    }

    command
      .complexFilter(['overlay=shortest=1'])
      .videoCodec(videoCodec)
      .outputOptions(outputOptions)
      .on('error', function(err) {
        console.log('An error occurred while merging: ', err);
        //throw new Meteor.Error( 500, 'There was an error processing sound.' );
        resolveCallback(new Error('An error occurred while merging: ', err));
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

        fs.move(filenameTmp, pathHelper.join(Meteor.settings.destinationPath, 'video_' + Date.now() + '.mp4'), function(err) {
          if (err) {
            throw err;
          } else {
            console.log(pathHelper.join(Meteor.settings.destinationPath, 'video_' + Date.now() + '.mp4') + ' has been created.');
          }
        });
        fs.unlinkSync(media);
        resolveCallback(null, 'ffmpeg - finished to layer images');
      })
      .save(filenameTmp);
  },
  'assembly': function(media, resolveCallback) {
    //path must be absolute

    var param = _.findWhere(Meteor.settings.composition.effect, {
      name: 'assembly'
    });
    var basepath = pathHelper.join(process.env.PWD, 'projects', param.type);

    var filenameTmp = pathHelper.join(process.env.PWD, '.temp', 'temp_' + Date.now() + '.mp4');
    var command = ffmpeg()
      .addInput(pathHelper.join(media, param.basename))
      //.inputOptions('-loop 1')
      //.addInput(pathHelper.join(basepath, param.source, param.basename));

    //add audio should be a post process as we might need it frequently
    if (Meteor.settings.composition.audio) {
      command.addInput(pathHelper.join(basepath, param.source, 'audio.mp3'))
    }

    command
      //.complexFilter(['overlay=shortest=1'])
      .videoCodec(videoCodec)
      .inputFPS(10)
      .outputOptions(outputOptions)
      .fps(25)
      .on('error', function(err) {
        console.log('An error occurred whiile merging: ', err);
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

        fs.move(filenameTmp, pathHelper.join(Meteor.settings.destinationPath, 'video_' + Date.now() + '.mp4'), function(err) {
          if (err) {
            throw err;
          } else {
            console.log(pathHelper.join(Meteor.settings.destinationPath, 'video_' + Date.now() + '.mp4') + ' has been created.');
            //fs.unlinkSync(media);
          }
        });
        resolveCallback(null, 'ffmpeg - finished to layer images');
      })
      .save(filenameTmp);
  }
}

Meteor.methods({
  ffmpeg: function(effect, media) {
    switch (effect) {
      case 'video-layer':
        console.log('ffmpeg - video-layer');
        videoLayer(media);
        break;
      case 'assembly':
        console.log('ffmpeg - assembly');
        var syncFunc = Meteor.wrapAsync(effectList[effect]);
        var result;
        try {
          result = syncFunc(media);
        } catch (err) {
          console.log("ffmpeg : " + err);
        } finally {
          return result;
        }
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
