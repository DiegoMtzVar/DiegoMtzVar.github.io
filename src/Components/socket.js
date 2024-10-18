import { io } from 'socket.io-client';

class SocketSingleton {
    constructor() {
        if (!SocketSingleton.instance) {
            const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';
            this.socket = io(URL, { autoConnect: false });
            SocketSingleton.instance = this;
        }

        return SocketSingleton.instance;
    }

    getSocket() {
        return this.socket;
    }
}

const instance = new SocketSingleton();
Object.freeze(instance);

export default instance.getSocket();