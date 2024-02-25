export interface MessagingContract {
  sendMessage(
    messageText: string,
    recipients: string | string[],
    via: string,
    otp: string,
    confirmed?: boolean,
  ): Promise<boolean>;
}
