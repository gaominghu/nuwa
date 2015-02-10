// advertise a socket.io server on port in settings
Meteor.startup(function() {
  mdns = Meteor.npmRequire('mdns');
  var ad = mdns.createAdvertisement(mdns.tcp(Meteor.settings.service.name), Meteor.settings.service.port);
  ad.start();
});