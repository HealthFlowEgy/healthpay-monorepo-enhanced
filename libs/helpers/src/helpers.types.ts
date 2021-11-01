// onelink types
export interface OnelinkTransactionResponse {
  transaction_id: string;
  iframe: string;
  order_id?: string | null;
}
// onelink types

// valu types
export interface ValuEnquiryParams {
  mobileNumber: string;
  productList: ValuProduct[];
}

export interface ValuProduct {
  productId: string;
  productPrice: number;
  orderId: string;
  downPayment: number;
  ToUAmount: number;
  CashbackAmount: number;
}
// valu types
