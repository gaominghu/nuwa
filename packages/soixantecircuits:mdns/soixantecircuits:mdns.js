if (Meteor.isServer) {
  var mdns = Npm.require('mdns');
  
  ZERO = ZERO || {};

  ZERO.services = [];

  ZERO.initService = function(serviceName, port) {
    ZERO.services.push(mdns.createAdvertisement(mdns.tcp(serviceName), port));
    ZERO.services[ZERO.services.length - 1].start();
  }
}