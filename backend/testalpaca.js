const API_KEY ='PKDTUF6IJQLY7MKOCZU37IDTWM';
const SECRET_KEY ='F2SsmyQMqpPeDELARo87k2XFyvp3q92mXyQAfLtbcMbZ';

fetch('https://paper-api.alpaca.markets/v2/account', {
  headers: {
    'APCA-API-KEY-ID': API_KEY,
  }
})
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));