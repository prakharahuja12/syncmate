import { EventEmitter } from 'node:events';

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();

// Increase max listeners for multiple decoupling listeners
eventBus.setMaxListeners(25);
