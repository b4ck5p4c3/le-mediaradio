import type {Display} from "./display";

const strings = ['Airplay', 'Pioneer', 'Bluetooth', 'B4CKSP4CE', 'Mediaradio',
  'IPhone/IPod', 'Aux Input', 'AVRCP', 'SBC', 'Ethernet', '18cm Antenna',
  'UI/UX', 'PLA casing', 'Orange Pi', 'DEXP DAC', 'Fake TI op-amp', 'ALAC',
  '2 yadra pol giga', '640 THz backlight'];

function getCenteredString(string: string): string {
  let centeredString = (''.padStart(10 - Math.floor(string.length / 2), ' ')) + string + (''.padEnd(10 - Math.floor(string.length / 2), ' '));
  centeredString = centeredString.slice(centeredString.length / 2 - 10, centeredString.length / 2 + 10);
  return centeredString;
}

function generateSimpleFrames(string: string, masks: string[], replaceChar: string): string[] {
  const result = [];
  for (const mask of masks) {
    let resultString = '';
    for (let i = 0; i < mask.length; i++) {
      if (mask.charAt(i) === replaceChar) {
        resultString += string.charAt(i);
      } else {
        resultString += mask.charAt(i);
      }
    }
    result.push(resultString);
  }
  return result;
}

function arrowsGenerator(string: string): string[] {
  const centeredString = getCenteredString(string);
  const masks = [
    '         <>         ',
    '        <-->        ',
    '       <---->       ',
    '      <--  -->      ',
    '     <-- ?? -->     ',
    '    <-- ???? -->    ',
    '   <-- ?????? -->   ',
    '  <-- ???????? -->  ',
    ' <-- ?????????? --> ',
    '<-- ???????????? -->',
    '-- ?????????????? --',
    '- ???????????????? -',
    ' ?????????????????? ',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
  ];

  return generateSimpleFrames(centeredString, masks, '?');
}

function rotationGenerator(string: string): string[] {
  const centeredString = getCenteredString(string);
  const masks = [
    '////////////////////',
    '--------------------',
    '\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
    '||||||||||||||||||||',
    '/////////??/////////',
    '--------????--------',
    '\\\\\\\\\\\\\\??????\\\\\\\\\\\\\\',
    '||||||????????||||||',
    '/////??????????/////',
    '----????????????----',
    '\\\\\\??????????????\\\\\\',
    '||????????????????||',
    '/??????????????????/',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
    '????????????????????',
  ];

  return generateSimpleFrames(centeredString, masks, '?');
}

type SingleLineGenerator = (string: string) => string[];

const singleLineGenerators: SingleLineGenerator[] = [
  rotationGenerator,
  arrowsGenerator
];

interface Frame {
  lines: string[];
  duration: number;
}

type StringGenerator = () => string;

function singleLineAnimationGenerator(stringGenerator: StringGenerator): Frame[] {
  const firstStringGenerator = singleLineGenerators[Math.floor(Math.random() * singleLineGenerators.length)];
  if (!firstStringGenerator) {
    throw new Error("No single line generator presented");
  }
  const secondStringGenerator = singleLineGenerators[Math.floor(Math.random() * singleLineGenerators.length)];
  if (!secondStringGenerator) {
    throw new Error("No single line generator presented");
  }

  const firstStringAnimation = firstStringGenerator(stringGenerator());
  const secondStringAnimation = secondStringGenerator(stringGenerator());

  return [...Array<Frame>(Math.max(firstStringAnimation.length, secondStringAnimation.length))]
    .map((_, i) => ({
      lines: [firstStringAnimation[Math.min(i, firstStringAnimation.length - 1)] ?? "",
        secondStringAnimation[Math.min(i, secondStringAnimation.length - 1)] ?? ""],
      duration: 100
    }));
}

function snakeGenerator(stringGenerator: StringGenerator): Frame[] {
  const string = stringGenerator();

  const positions = [
    [1, 2, 0, 6, 7, 8, 0, 12, 13, 14, 0, 18, 19, 20, 0, 24, 25, 26, 0, 30],
    [0, 3, 4, 5, 0, 9, 10, 11, 0, 15, 16, 17, 0, 21, 22, 23, 0, 27, 28, 29]
  ];

  const frames: Frame[] = [];

  for (let i = 0; i < 30 + string.length; i++) {
    const stringForFrame = (''.padStart(30, ' ') + string).slice(i).padEnd(30, ' ').slice(0, 30);
    const frame: Frame = {
      lines: [],
      duration: 150
    };
    for (let line = 0; line < 2; line++) {
      let currentLine = '';
      for (let j = 0; j < 20; j++) {
        currentLine += (positions[line] ?? [])[j] === 0 ? ' ' : stringForFrame.charAt(
          ((positions[line] ?? [])[j] ?? 0) - 1);
      }
      frame.lines.push(currentLine);
    }
    frames.push(frame);
  }

  return frames;
}

function zigZagGenerator(stringGenerator: StringGenerator): Frame[] {
  const centeredString = getCenteredString(stringGenerator());

  const frames: Frame[] = [];
  for (let i = 0; i < 20; i++) {
    const frame: Frame = {
      lines: [],
      duration: 200
    }
    for (let j = 0; j < 2; j++) {
      frame.lines[j] = '';
      for (let k = 0; k < 20; k++) {
        if ((k + j + i) % 2 === 0) {
          frame.lines[j] += ' ';
        } else {
          frame.lines[j] += centeredString.charAt(k);
        }
      }
    }
    frames.push(frame);
  }

  return frames;
}

type AnimationGenerator = (stringGenerator: StringGenerator) => Frame[];

const animations: AnimationGenerator[] = [
  singleLineAnimationGenerator,
  snakeGenerator,
  zigZagGenerator,
];

function generateAnimation(): Frame[] {
  const animationGenerator = animations[Math.floor(Math.random() * animations.length)];
  if (!animationGenerator) {
    throw new Error("No animations present");
  }
  return animationGenerator(() => {
    const string = strings[Math.floor(Math.random() * strings.length)];
    if (!string) {
      throw new Error("No strings present");
    }
    return string;
  });
}

export class DisplayAnimator {
  private running = false;
  private currentFrames: Frame[] = [];
  private currentFrame = 0;

  constructor(private readonly display: Display) {
  }

  start(): void {
    if (!this.running) {
      this.running = true;
      this.drawFrame();
    }
  }

  drawFrame(): void {
    if (!this.running) {
      return;
    }

    if (this.currentFrame === this.currentFrames.length) {
      this.currentFrame = 0;
      this.currentFrames = generateAnimation();
    }

    this.display.setFirstLine(this.currentFrames[this.currentFrame]?.lines[0] ?? "");
    this.display.setSecondLine(this.currentFrames[this.currentFrame]?.lines[1] ?? "");
    setTimeout(() => { this.drawFrame(); }, this.currentFrames[this.currentFrame++]?.duration ?? 0);
  }

  stop(): void {
    this.running = false;
  }
}
