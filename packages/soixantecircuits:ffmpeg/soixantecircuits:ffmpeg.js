if (Meteor.isServer) {
  var fluentffmpeg = Npm.require('fluent-ffmpeg');
  ffmpeg = fluentffmpeg || {}; 
}