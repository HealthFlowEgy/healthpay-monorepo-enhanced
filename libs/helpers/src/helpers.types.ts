export interface AuthHeaders {
  Authorization: string;
}

// onelink types
export interface OnelinkTransactionResponse {
  transaction_id: string;
  iframe: string;
  order_id?: string | null;
}
// onelink types
