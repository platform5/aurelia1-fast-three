export interface RandomOptions {
  charset: string;
  length: number;
  exclude?: string;
}

export class StringHelpers {
  static numbers = '0123456789';
  static letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  static specials = '!$%^&*()_+|~-=`{}[]:;<>?,./';

  static default: RandomOptions = {
    charset: StringHelpers.letters,
    length: 12
  };

  static random(options: RandomOptions): string {
    let charset = options.charset;
    if (charset === 'letters') charset = StringHelpers.letters;
    if (charset === 'numbers') charset = StringHelpers.numbers;
    if (charset === 'specials') charset = StringHelpers.specials;
    if (charset === 'alphanumeric') charset = StringHelpers.letters + StringHelpers.numbers;
    if (charset === 'all') charset = StringHelpers.letters + StringHelpers.numbers + StringHelpers.specials;

    if (options.exclude) {
        for (let i = 0; i <= options.exclude.length; i++){
            charset = charset.replace(options.exclude[i], '');
        }
    }

    let randomReturned = '';
    let rn: number;
    for (let i = 1; i <= options.length; i++) {
        randomReturned += charset.substring(rn = Math.floor(Math.random() * charset.length), rn + 1);
    }

    return randomReturned;
  }

  static randomString(nbChars = 12): string {
    return StringHelpers.random({charset: StringHelpers.letters, length: nbChars});
  }

  static randomNumbers(nbChars = 6): string {
    return StringHelpers.random({charset: StringHelpers.numbers, length: nbChars});
  }

  static randomToken(nbChars = 24): string {
    return StringHelpers.random({charset: 'all', length: nbChars});
  }

  static validatePhoneNumber(phoneNumber: string) {
    if (typeof phoneNumber !== 'string') return false;
    if (phoneNumber[0] !== '+') return false;

    phoneNumber = phoneNumber.substr(1); // remove the original +

    // remove all non-numeric chars
    phoneNumber = phoneNumber.replace(/([^0-9]*)/g, '');

    if (phoneNumber.substr(0, 2) === '41') {
      // swiss phone number
      let part1 = phoneNumber.substr(0, 2);
      let part2 = phoneNumber.substr(2);

      if (part2[0] === '0') {
        part2 = part2.substr(1); // remove the first 0 if present
      }
      if (part2.length === 9) {
        return `+${part1}${part2}`;
      }
    }
    return false;
  }

  static validateEmail(email: string): boolean {
    return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) !== null;
  }
}
