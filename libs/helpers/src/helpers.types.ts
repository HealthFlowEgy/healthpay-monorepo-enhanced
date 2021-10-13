// onelink types
export interface OnelinkTransactionResponse {
  transaction_id: string;
  iframe: string;
  order_id?: string | null;
}
// onelink types

// valu types
export interface ValuEnquiryParams {
  aggregatorId: string;
  userName: string;
  storeId: string;
  mobileNumber: string;
  hmac: string;
  productList: [
    {
      productId: string;
      productPrice: number;
      downPayment: number;
      discount: number;
      expense: number;
      orderId: string;
    },
  ];
}

export interface ValuVerifyCustomerParams {
  aggregatorId: string;
  hmac: string;
  userName: string;
  orderId: string;
  mobileNumber: string;
  storeId: string;
}

export interface ValuProductPurchaseParams {
  aggregatorId: string;
  hmac: string;
  userName: string;
  mobileNumber: string;
  otp: string;
  storeId: string;
  productList: [
    {
      productId: string;
      productPrice: number;
      orderId: string;
      expense: number;
      adminFees?: number;
      discountType: number;
      discount: number;
      tenure: number;
      downPayment: number;
    },
  ];
}
// valu types
