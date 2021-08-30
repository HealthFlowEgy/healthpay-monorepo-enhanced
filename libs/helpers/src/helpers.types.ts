export interface OnelinkTransactionResponse {
  transaction_id: string;
  iframe: string;
  order_id?: string | null;
}
