Package.describe({
  name: 'soixantecircuits:mdns',
  summary: 'Simple wrapper around node_mdns ',
  version: '0.0.1',
  git: ''
});

Npm.depends({
  "mdns": "2.2.2"
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');
  api.addFiles('soixantecircuits:mdns.js');
  api.export('ZERO');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('soixantecircuits:mdns');
  api.addFiles('soixantecircuits:mdns-tests.js');
});
