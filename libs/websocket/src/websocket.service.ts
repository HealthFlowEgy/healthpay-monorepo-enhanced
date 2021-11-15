import { Wallet } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { w3cwebsocket } from 'websocket';
import WsTransaction from './transaction';
import WebsocketEvent from './websocket-event';
import { WEBSOCKET_EVENTS } from './websocket-events';

@Injectable()
export class WebsocketService {
  // constractor init websocket
  ws: w3cwebsocket;
  retryMS: number;
  retryTO: any;

  constructor(
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    this.init();
    this.retryMS = 5000;
  }

  init() {
    this.ws = new w3cwebsocket(
      this.configService.get('HP_LEDGER', 'ws://localhost:3000/updates'),
    );
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
  }

  /*
   * Websocket onOpen
   * @param {any} event
   * @returns {void}
   * @memberof WebsocketService
   * @private
   * @description
   * open websocket
   * send message to server
   */
  onOpen() {
    console.log('[HP_LEDGER] CONNECTED');
  }

  /*
   * Websocket onClose
   * @param {any} event
   * @returns {void}
   * @memberof WebsocketService
   * @private
   * @description
   * close websocket
   */
  onClose() {
    console.log('[HP_LEDGER] CLOSED');
    this.reconnect();
  }

  /*
   * Websocket onMessage
   * @param {any} event
   * @returns {void}
   * @memberof WebsocketService
   * @private
   * @description
   * receive message from server
   */
  onMessage(event) {
    console.log('[LEDGER_EVENT]', event.data);
    const message = new WebsocketEvent();
    message.createFromJSON(event.data);
    if (message.isValid()) {
      this.handleMessage(message);
    }
  }

  /*
   * Websocket onError
   * @param {any} event
   * @returns {void}
   * @memberof WebsocketService
   * @private
   */
  onError(event) {
    console.log(event.type);
    console.log('[HP_LEDGER] ERROR');
    this.reconnect();
  }

  /*
   * Websocket reconnect
   * @returns {void}
   * @memberof WebsocketService
   * @private
   * @description
   * reconnect websocket
   */
  reconnect() {
    console.log(`reconnect in ${this.retryMS}`);
    clearTimeout(this.retryTO);
    this.retryTO = setTimeout(() => this.init(), this.retryMS);
  }

  /*
   *  Websocket handleMessage
   * @param {WebsocketEvent} message
   * @returns {void}
   * @memberof WebsocketService
   * @private
   * @description
   * handle message from server
   */
  handleMessage(wsMsg: WebsocketEvent) {
    this.eventEmitter.emit(WEBSOCKET_EVENTS[wsMsg.getEventType()], wsMsg);
  }

  /*
   * Websocket Send
   * @param {WebsocketEvent} message
   * @returns {void}
   * @memberof WebsocketService
   */
  send(message: WebsocketEvent) {
    this.ws.readyState === w3cwebsocket.OPEN &&
      this.ws.send(JSON.stringify(message));
  }

  @OnEvent(WEBSOCKET_EVENTS.PRISMA_NEW_TX)
  onNewPrismaTx(tx: WsTransaction) {
    const newEvent = new WebsocketEvent();
    newEvent.setEventType('TX_NEW');
    newEvent.setData(tx.toLedger());
    this.send(newEvent);
  }

  @OnEvent(WEBSOCKET_EVENTS.UTXO_QUERY)
  onUTXOQuery({ id }: Wallet) {
    const newEvent = new WebsocketEvent();
    newEvent.setEventType('UTXO_QUERY');
    newEvent.setData({ publicKey: `${id}` });
    this.send(newEvent);
  }
}
