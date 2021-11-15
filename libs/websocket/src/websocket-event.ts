import { WEBSOCKET_EVENTS } from './websocket-events';

type WSEventType = keyof typeof WEBSOCKET_EVENTS;
type anyObject = { [key: string]: any };
export default class WebsocketEvent {
  data: anyObject;
  init: boolean;
  event: WSEventType;

  createFromJSON(stringJson: string) {
    this.parseEvent(JSON.parse(stringJson));
  }

  /*
   * @param {string} Event
   * @param {anyObject} data
   * @param {boolean} init
   */
  parseEvent({ event, data }: { event: WSEventType; data: anyObject }) {
    this.event = event;
    this.data = data;
  }

  setEventType(Event: WSEventType) {
    this.event = Event;
  }

  setData(data: anyObject) {
    this.data = data;
  }

  isValid() {
    return this.event != null;
  }

  getEventType() {
    return this.event;
  }

  getData() {
    return this.data;
  }
}
