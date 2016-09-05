var swarm = require('webrtc-swarm');
var signalhub = require('signalhub');

var hub = signalhub('swarm-example', ['https://webly-soccer.herokuapp.com/']);

var uuid = (Math.random() * 10e6).toString(36);

module.exports = function connect(onpeer, ondata, ondisconnect) {
  var sw = swarm(hub, {
    uuid: uuid,
    maxPeers: 1,
  });

  sw.on('peer', function (peer, id) {
    console.log('connected to a new peer:', id);
    console.log('total peers:', sw.peers.length);

    onpeer(peer, id);
    peer.on('data', ondata);
  })

  sw.on('disconnect', function (peer, id) {
    console.log('disconnected from a peer:', id)
    console.log('total peers:', sw.peers.length)
    ondisconnect(peer);
  });
};
