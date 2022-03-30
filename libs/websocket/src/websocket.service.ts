import { Wallet } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { w3cwebsocket } from 'websocket';
import WsTransaction, { HP_RESERVED_IDS } from './transaction';
import WebsocketEvent from './websocket-event';
import { WEBSOCKET_EVENTS } from './websocket-events';

@Injectable()
export class WebsocketService {
  // constractor init websocket
  private readonly logger = new Logger(WebsocketService.name);

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
    this.logger.verbose('[HP_LEDGER] CONNECTED');
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
    this.logger.error('[HP_LEDGER] CLOSED');
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
    const message = new WebsocketEvent();
    message.createFromJSON(event.data);
    this.logger.log(
      `[onMessage] ${message.getEventType()} ${JSON.stringify(getData)}`,
    );
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
    this.logger.verbose(`reconnect in ${this.retryMS}`);
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
    let strID = `${id}`;
    if (HP_RESERVED_IDS.includes(`${id}`)) {
      strID = 'root';
    }
    newEvent.setData({ publicKey: strID });
    this.send(newEvent);
  }
}
