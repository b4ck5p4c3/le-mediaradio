import { pino } from 'pino';
import { SerialPort } from 'serialport';

const DISPLAY_WIDTH = 20;
const logger = pino({ name: 'display' });

function serialWrite(
  serialPort: SerialPort,
  buffer: Uint8Array,
): Promise<void> {
  return new Promise((resolve, reject) => {
    serialPort.write(buffer, (e) => {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });
}

const cp866CharMap: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  21: 21,
  22: 22,
  23: 23,
  24: 24,
  25: 25,
  26: 26,
  27: 27,
  28: 28,
  29: 29,
  30: 30,
  31: 31,
  32: 32,
  33: 33,
  34: 34,
  35: 35,
  36: 36,
  37: 37,
  38: 38,
  39: 39,
  40: 40,
  41: 41,
  42: 42,
  43: 43,
  44: 44,
  45: 45,
  46: 46,
  47: 47,
  48: 48,
  49: 49,
  50: 50,
  51: 51,
  52: 52,
  53: 53,
  54: 54,
  55: 55,
  56: 56,
  57: 57,
  58: 58,
  59: 59,
  60: 60,
  61: 61,
  62: 62,
  63: 63,
  64: 64,
  65: 65,
  66: 66,
  67: 67,
  68: 68,
  69: 69,
  70: 70,
  71: 71,
  72: 72,
  73: 73,
  74: 74,
  75: 75,
  76: 76,
  77: 77,
  78: 78,
  79: 79,
  80: 80,
  81: 81,
  82: 82,
  83: 83,
  84: 84,
  85: 85,
  86: 86,
  87: 87,
  88: 88,
  89: 89,
  90: 90,
  91: 91,
  92: 92,
  93: 93,
  94: 94,
  95: 95,
  96: 96,
  97: 97,
  98: 98,
  99: 99,
  100: 100,
  101: 101,
  102: 102,
  103: 103,
  104: 104,
  105: 105,
  106: 106,
  107: 107,
  108: 108,
  109: 109,
  110: 110,
  111: 111,
  112: 112,
  113: 113,
  114: 114,
  115: 115,
  116: 116,
  117: 117,
  118: 118,
  119: 119,
  120: 120,
  121: 121,
  122: 122,
  123: 123,
  124: 124,
  125: 125,
  126: 126,
  127: 127,
  160: 255,
  164: 253,
  176: 248,
  183: 250,
  1025: 240,
  1028: 242,
  1031: 244,
  1038: 246,
  1040: 128,
  1041: 129,
  1042: 130,
  1043: 131,
  1044: 132,
  1045: 133,
  1046: 134,
  1047: 135,
  1048: 136,
  1049: 137,
  1050: 138,
  1051: 139,
  1052: 140,
  1053: 141,
  1054: 142,
  1055: 143,
  1056: 144,
  1057: 145,
  1058: 146,
  1059: 147,
  1060: 148,
  1061: 149,
  1062: 150,
  1063: 151,
  1064: 152,
  1065: 153,
  1066: 154,
  1067: 155,
  1068: 156,
  1069: 157,
  1070: 158,
  1071: 159,
  1072: 160,
  1073: 161,
  1074: 162,
  1075: 163,
  1076: 164,
  1077: 165,
  1078: 166,
  1079: 167,
  1080: 168,
  1081: 169,
  1082: 170,
  1083: 171,
  1084: 172,
  1085: 173,
  1086: 174,
  1087: 175,
  1088: 224,
  1089: 225,
  1090: 226,
  1091: 227,
  1092: 228,
  1093: 229,
  1094: 230,
  1095: 231,
  1096: 232,
  1097: 233,
  1098: 234,
  1099: 235,
  1100: 236,
  1101: 237,
  1102: 238,
  1103: 239,
  1105: 241,
  1108: 243,
  1111: 245,
  1118: 247,
  8470: 252,
  8729: 249,
  8730: 251,
  9472: 196,
  9474: 179,
  9484: 218,
  9488: 191,
  9492: 192,
  9496: 217,
  9500: 195,
  9508: 180,
  9516: 194,
  9524: 193,
  9532: 197,
  9552: 205,
  9553: 186,
  9554: 213,
  9555: 214,
  9556: 201,
  9557: 184,
  9558: 183,
  9559: 187,
  9560: 212,
  9561: 211,
  9562: 200,
  9563: 190,
  9564: 189,
  9565: 188,
  9566: 198,
  9567: 199,
  9568: 204,
  9569: 181,
  9570: 182,
  9571: 185,
  9572: 209,
  9573: 210,
  9574: 203,
  9575: 207,
  9576: 208,
  9577: 202,
  9578: 216,
  9579: 215,
  9580: 206,
  9600: 223,
  9604: 220,
  9608: 219,
  9612: 221,
  9616: 222,
  9617: 176,
  9618: 177,
  9619: 178,
  9632: 254,
};

function convertToCP866(s: string): Uint8Array {
  const result: number[] = [];
  for (const c of s) {
    const code = c.charCodeAt(0);
    result.push(cp866CharMap[code] ?? '?'.charCodeAt(0));
  }
  return new Uint8Array(result);
}

export class Display {
  private firstLine = 'B4CKSP4CE';
  private secondLine = 'Media-Radio';
  private firstLinePosition = 0;
  private secondLinePosition = 0;
  private serialPort: SerialPort;

  constructor(private readonly comPort: string) {
    this.serialPort = new SerialPort({
      path: comPort,
      baudRate: 9600,
      autoOpen: false,
    });
  }

  setFirstLine(text: string): void {
    this.firstLine = text;
    this.resetPosition();
  }

  setSecondLine(text: string): void {
    this.secondLine = text;
    this.resetPosition();
  }

  resetPosition(): void {
    this.firstLinePosition = 0;
    this.secondLinePosition = 0;
  }

  static getScrolledString(text: string, position: number): string {
    if (text.length <= DISPLAY_WIDTH) {
      return text.padEnd(DISPLAY_WIDTH, ' ');
    }
    const stringPosition = position % (text.length + 13);
    if (stringPosition > text.length + 3) {
      return text.slice(0, DISPLAY_WIDTH);
    }
    return `${text}   ${text}`.slice(
      stringPosition,
      stringPosition + DISPLAY_WIDTH,
    );
  }

  display(): void {
    (async () => {
      const firstString = Display.getScrolledString(
        this.firstLine,
        this.firstLinePosition++,
      );
      const secondString = Display.getScrolledString(
        this.secondLine,
        this.secondLinePosition++,
      );

      await serialWrite(this.serialPort, Uint8Array.from([0x1f, 0x24, 1, 1]));
      await serialWrite(this.serialPort, convertToCP866(firstString));
      await serialWrite(this.serialPort, Uint8Array.from([0x0d, 0x0a]));
      await serialWrite(this.serialPort, convertToCP866(secondString));
    })()
      .then(() => {
        logger.debug('Display frame sent');
      })
      .catch((err) => {
        logger.error(err, 'Error occured during frame send to the display');
        throw err;
      });
  }

  run(): void {
    this.serialPort.open();
    this.serialPort.once('open', () => {
      serialWrite(
        this.serialPort,
        Uint8Array.from([
          0x1b,
          0x74,
          0x06, // set encoding
          0x1b,
          0x40, // clear display
        ]),
      )
        .then(() =>
          setInterval(() => {
            this.display();
          }, 100),
        )
        .catch((err) => {
          logger.error(err, 'Error occured during display init');
          throw err;
        });
    });

    this.serialPort.on('error', (err) => {
      logger.error(
        err,
        'Error occured during serial communication with the display',
      );
      throw err;
    });
  }
}
