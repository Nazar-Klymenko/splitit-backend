const redis = require("redis");

client = redis.createClient(process.env.REDISTOGO_URL);

client.on("connect", () => {
  console.log("Client connected to redis");
});
client.on("ready", () => {
  console.log("Client is ready to use");
});

client.on("error", (error) => {
  console.log(error.message);
});

client.on("end", () => {
  console.log("Client closed");
});

process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
