const http = require("http");

function listeningReporter() {
  const {
    address, port
  } = this.address();
  const protocol = this.addContext ? "https" : "http";
  console.info(`Listening on ${protocol}://${address}:${port}...`);
}

module.exports = async(app) => {
  http.createServer(app.callback())
    .listen(80, listeningReporter);
};
