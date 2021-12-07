import { SHA256 } from 'crypto-js';

const HP_RESERVED_IDS = ['12', '13', '0', '6'];

export default class WsTransaction {
  inputPublicKey: string;
  outputPublicKey: string;
  amount: number;
  fee?: number;
  signature?: string;
  hash?: string;
  transRef?: string;
  constructor(
    inputPublicKey,
    outputPublicKey,
    amount: number,
    fee: number,
    ref,
  ) {
    this.transRef = ref;
    this.inputPublicKey = `${inputPublicKey}`;
    this.outputPublicKey = `${outputPublicKey}`;
    this.amount = parseInt(`${amount}`);
    this.fee = fee;
    this._setPrismaIdsToRoot();
    this._setHash();
    this._setSignature();
  }

  _setPrismaIdsToRoot() {
    if (HP_RESERVED_IDS.includes(this.inputPublicKey)) {
      this.inputPublicKey = 'root';
    }
    if (HP_RESERVED_IDS.includes(this.outputPublicKey)) {
      this.outputPublicKey = 'root';
    }
  }

  _setHash() {
    this.hash = this._calculateHash();
  }

  _setSignature() {
    console.log(this.hash);
    this.signature =
      this.transRef +
      '.' +
      SHA256(this._calculateHash() + process.env.HP_SECERT_KEY).toString();
  }

  _calculateHash() {
    console.log(
      '[calchash]',
      `${this.inputPublicKey + this.outputPublicKey + this.amount + this.fee}`,
    );
    return SHA256(
      this.inputPublicKey + this.outputPublicKey + this.amount + this.fee,
    ).toString();
  }

  toPrisma() {
    return {
      inputPublicKey: `${this.inputPublicKey}`,
      outputPublicKey: `${this.outputPublicKey}`,
      amount: this.amount / 100,
      fee: this.fee / 100,
      signature: this.signature,
      hash: this.hash,
      transRef: this.transRef,
    };
  }

  toLedger() {
    return {
      inputPublicKey: `${this.inputPublicKey}`,
      outputPublicKey: `${this.outputPublicKey}`,
      amount: parseInt(this.amount.toFixed(0)),
      fee: this.fee,
      signature: this.signature,
      hash: this.hash,
      transRef: this.transRef,
    };
  }
}
export function fromLedger(ledger): WsTransaction {
  return new WsTransaction(
    ledger.inputPublicKey,
    ledger.outputPublicKey,
    ledger.amount,
    ledger.fee,
    ledger.signature.split('.')[0],
  );
}

export function fromPrisma(
  inputPublicKey,
  outputPublicKey,
  amount: number,
  fee: number,
  ref,
): WsTransaction {
  return new WsTransaction(
    inputPublicKey,
    outputPublicKey,
    parseInt((amount * 100).toFixed(0)),
    parseInt((fee * 100).toFixed(0)),
    ref,
  );
}
