const ElizaBot = require('./elizabot')
const bitpipe = require('bitpipe')
const axios = require('axios')
const EventSource = require('eventsource')
const eliza = new ElizaBot()
const initial = eliza.getInitial();
/************************************************************
*
*   "chatty": chatty factor. The lower the chattier
*
*   by default, Eli will respond once for every N incoming
*   messages (where N is a random value between 3 and 7)
*
************************************************************/
const chatty = {
  min: 2,
  max: 7
}
var counter = 0
var current_max = Math.random() * (chatty.max - chatty.min) + chatty.min;
var bitsocket
// A Bitquery to filter the realtime stream
// Learn more at https://bitsocket.org
const query = {
  "v": 3,
  "q": {
    "find": {
      "out.b0": { "op": 106 },
      "out.b1": { "op": 0 }
    }
  },
  "r": {
    "f": "[.[] | { m: .out[0].s2, t: .timestamp, h: .tx.h }]"
  }
}
const listen = function() {
  let b64 = Buffer.from(JSON.stringify(query)).toString("base64")
  bitsocket = new EventSource('https://chronos.bitdb.network/s/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/'+b64)
  bitsocket.onmessage = function(e) {
    let o = JSON.parse(e.data)
    // Filter incoming SSE events
    if (o.type === 't') {
      let items = o.data[0].m.split(":")
      if (items.length >= 2) {
        console.log(items[0].trim().toLowerCase(), items[1])
        // Filter out own messages
        if (items[0].trim().toLowerCase() !== "eli") {
          console.log("counter=", counter)
          console.log("current max = ", current_max)
          if (counter <= current_max) {
            counter++
          } else {
            send(eliza.transform(items[1].trim()))
            current_max = Math.random() * (chatty.max - chatty.min) + chatty.min;
            counter = 0
          }
        }
      }
    }
  }
}
const send = function(line) {
  const _datapay = {
    data: ["", line]
  }
  // Submit Datapay payload to local Bitpipe API Endpoiont
  axios.post("http://localhost:8082/bitpipe", _datapay)
  .then(function(res) {
    console.log(res.data)
  }).catch(function(e) {
    console.log("Error", e)
  })
}
bitpipe.start({
  port: 8082,
  // Transforms incoming datapay payload to attach a prefix "Eli: "
  lambda: function(req, payload, pipe) {
    payload.data[1] = "Eli: " + payload.data[1]
    pipe(null, payload)
  },
  onconnect: function() {
    console.log("Bitcoinbot Online...")
    listen()
  }
})
