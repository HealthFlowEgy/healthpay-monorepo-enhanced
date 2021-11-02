import { Injectable } from '@nestjs/common';
import * as yup from 'yup';
@Injectable()
export class ValidationsService {
  phoneRegExp =
    /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
  async isValidMobile(mobile) {
    const schema = yup.object().shape({
      mobile: yup
        .string()
        .matches(this.phoneRegExp, 'Mobile number is not valid'),
    });
    return schema.validate({
      mobile: mobile,
    });
  }
}
