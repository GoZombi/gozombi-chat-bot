import GameDig from 'gamedig';

export class Server {
  ip;
  port;

  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
  }

  async updateInfo() {
    try {
      this.game_info = await GameDig.query({
        type: 'cs16',
        host: this.ip,
        port: this.port,
        givenPortOnly: true
      });
    } catch (e) {
      this.game_info = 0;
    }
  }

  getGameInfo() {
    return this.game_info;
  }
}
