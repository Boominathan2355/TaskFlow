import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.global = window;
    window.Buffer = Buffer;
    window.process = {
        env: { DEBUG: undefined },
        version: '',
        nextTick: (cb) => setTimeout(cb, 0),
    };
}
